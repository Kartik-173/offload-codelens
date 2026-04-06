import React, { useState, useMemo, useEffect } from "react";
import {
  Shield as SecurityIcon,
  TriangleAlert as WarningAmberIcon,
  CircleCheck as CheckCircleIcon,
  Search as SearchIcon,
  Eye as VisibilityIcon,
  EyeOff as VisibilityOffIcon,
  ChevronDown as ExpandMoreIcon,
  Timer as TimerIcon,
  FolderOpen as FolderOpenIcon,
  Code as CodeIcon,
  TrendingUp as TrendingUpIcon,
  Lock as LockIcon,
  FileText as DescriptionIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const Box = ({ children, className = "", ...rest }) => (
  <div className={className} {...rest}>{children}</div>
);

const Card = ({ children, className = "", ...rest }) => (
  <div className={className} {...rest}>{children}</div>
);

const CardContent = ({ children, className = "", ...rest }) => (
  <div className={className} {...rest}>{children}</div>
);

const Typography = ({ children, className = "", component = "p", ...rest }) => {
  const Tag = component;
  return <Tag className={className} {...rest}>{children}</Tag>;
};

const Chip = ({ label, className = "", onDelete }) => (
  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${className}`.trim()}>
    {label}
    {onDelete ? (
      <button type="button" onClick={onDelete} className="text-slate-500">×</button>
    ) : null}
  </span>
);

const Grid = ({ children, className = "", ...rest }) => (
  <div className={className} {...rest}>{children}</div>
);

const IconButton = ({ children, onClick, className = "", ...rest }) => (
  <button type="button" onClick={onClick} className={className} {...rest}>{children}</button>
);

const Collapse = ({ in: isOpen, children }) => (isOpen ? <>{children}</> : null);

const CircularProgress = () => (
  <div className="h-14 w-14 animate-spin rounded-full border-4 border-slate-300 border-t-slate-700" />
);

const TableContainer = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const Table = ({ children, className = "" }) => (
  <table className={className}>{children}</table>
);

const TableHead = ({ children }) => <thead>{children}</thead>;
const TableBody = ({ children }) => <tbody>{children}</tbody>;
const TableRow = ({ children, className = "" }) => <tr className={className}>{children}</tr>;
const TableCell = ({ children, className = "", colSpan }) => (
  <td className={className} colSpan={colSpan}>{children}</td>
);

const InputAdornment = ({ children }) => <span className="inline-flex items-center">{children}</span>;
const FormControl = ({ children, className = "" }) => <div className={className}>{children}</div>;
const InputLabel = ({ children }) => <span className="text-xs text-slate-500">{children}</span>;
const Select = ({ children, className = "", value, onChange }) => (
  <select value={value} onChange={onChange} className={`h-9 rounded-md border border-input bg-background px-3 text-sm ${className}`.trim()}>
    {children}
  </select>
);
const MenuItem = ({ children, value }) => <option value={value}>{children}</option>;

const TextField = ({
  value,
  onChange,
  placeholder,
  className = "",
  InputProps,
  select,
  children,
}) => {
  if (select) {
    return (
      <Select value={value} onChange={onChange} className={className}>
        {children}
      </Select>
    );
  }

  return (
    <div className="relative">
      {InputProps?.startAdornment ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          {InputProps.startAdornment}
        </span>
      ) : null}
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`h-9 rounded-md border border-input bg-background px-3 text-sm ${InputProps?.startAdornment ? "pl-9" : ""} ${className}`.trim()}
      />
    </div>
  );
};

const Tooltip = ({ children, title }) => (
  <span title={typeof title === "string" ? title : undefined}>{children}</span>
);

const Divider = ({ className = "" }) => <div className={className} />;

const TablePagination = ({
  count,
  page,
  onPageChange,
  rowsPerPage,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 25, 50],
  className = "",
}) => {
  const totalPages = Math.max(1, Math.ceil(count / rowsPerPage));
  const start = count === 0 ? 0 : page * rowsPerPage + 1;
  const end = Math.min(count, (page + 1) * rowsPerPage);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 px-2 py-3 text-sm ${className}`.trim()}>
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        <select
          value={rowsPerPage}
          onChange={onRowsPerPageChange}
          className="h-8 rounded border border-input bg-background px-2"
        >
          {rowsPerPageOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span>{start}-{end} of {count}</span>
        <button
          type="button"
          onClick={() => onPageChange(null, Math.max(0, page - 1))}
          disabled={page <= 0}
          className="rounded border p-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span>{page + 1}/{totalPages}</span>
        <button
          type="button"
          onClick={() => onPageChange(null, Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className="rounded border p-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default function GitSecretsView({ loading, gitSecretsReport }) {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [ruleFilter, setRuleFilter] = useState("all");
  const [showSecrets, setShowSecrets] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const findings = useMemo(
    () => (Array.isArray(gitSecretsReport?.findings) ? gitSecretsReport.findings : []),
    [gitSecretsReport]
  );

  const uniqueRules = useMemo(() => {
    const rules = [...new Set(findings.map(f => f.rule))];
    return rules.sort();
  }, [findings]);

  const filteredFindings = useMemo(() => {
    return findings.filter(finding => {
      const matchesSearch = !searchTerm || 
        finding.file.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.rule.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSeverity = severityFilter === "all" || finding.severity === severityFilter.toUpperCase();
      const matchesRule = ruleFilter === "all" || finding.rule === ruleFilter;
      
      return matchesSearch && matchesSeverity && matchesRule;
    });
  }, [findings, searchTerm, severityFilter, ruleFilter]);

  const paginatedFindings = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredFindings.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredFindings, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, severityFilter, ruleFilter]);

  const toggleRowExpansion = (rowKey) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowKey)) newExpanded.delete(rowKey);
    else newExpanded.add(rowKey);
    setExpandedRows(newExpanded);
  };

  const maskSecret = (content) => {
    if (showSecrets) return content;
    if (content.length <= 8) return '*'.repeat(content.length);
    return content.substring(0, 4) + '*'.repeat(content.length - 8) + content.substring(content.length - 4);
  };

  if (loading) {
    return (
      <Box className="git-secrets-view">
        <Box className="git-secrets-loading-container">
          <Box className="git-secrets-loading-spinner">
            <CircularProgress size={60} thickness={4} className="git-secrets-spinner" />
          </Box>
          <Typography variant="h6" className="git-secrets-loading-text">
            Scanning Repository for Secrets
          </Typography>
          <Typography variant="body2" className="git-secrets-loading-subtext">
            Analyzing files for sensitive information...
          </Typography>
        </Box>
      </Box>
    );
  }

  const summary = {
    totalFindings: gitSecretsReport?.totalFindings || 0,
    status: gitSecretsReport?.status || 'UNKNOWN',
    scanDuration: gitSecretsReport?.scanDuration || 0,
    scanTime: gitSecretsReport?.scanTime || '',
  };

  return (
    <Box className="git-secrets-view">
      {/* Summary Cards */}
      <Grid container spacing={2} className="git-secrets-summary-grid">
        <Grid size={{ xs: 6, md: 3 }}>
          <Card className="git-secrets-stat-card">
            <CardContent className="git-secrets-stat-content">
              <Box className="git-secrets-stat-icon-wrapper git-secrets-stat-icon-secrets">
                <SecurityIcon className="git-secrets-stat-icon" />
              </Box>
              <Typography variant="h4" className="git-secrets-stat-value">
                {summary.totalFindings}
              </Typography>
              <Typography variant="caption" className="git-secrets-stat-label">
                Secrets Found
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, md: 3 }}>
          <Card className="git-secrets-stat-card">
            <CardContent className="git-secrets-stat-content">
              <Box className={`git-secrets-stat-icon-wrapper git-secrets-stat-icon-status-${summary.status.toLowerCase()}`}>
                {summary.status === 'PASSED' ? (
                  <CheckCircleIcon className="git-secrets-stat-icon" />
                ) : (
                  <WarningAmberIcon className="git-secrets-stat-icon" />
                )}
              </Box>
              <Chip 
                label={summary.status} 
                size="small"
                color={summary.status === 'PASSED' ? 'success' : 'error'}
                className="git-secrets-status-chip"
              />
              <Typography variant="caption" className="git-secrets-stat-label">
                Status
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, md: 3 }}>
          <Card className="git-secrets-stat-card">
            <CardContent className="git-secrets-stat-content">
              <Box className="git-secrets-stat-icon-wrapper git-secrets-stat-icon-duration">
                <TimerIcon className="git-secrets-stat-icon" />
              </Box>
              <Typography variant="h4" className="git-secrets-stat-value">
                {summary.scanDuration}<Typography component="span" variant="caption" className="git-secrets-stat-unit">ms</Typography>
              </Typography>
              <Typography variant="caption" className="git-secrets-stat-label">
                Duration
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 6, md: 3 }}>
          <Card className="git-secrets-stat-card">
            <CardContent className="git-secrets-stat-content">
              <Box className="git-secrets-stat-icon-wrapper git-secrets-stat-icon-time">
                <SecurityIcon className="git-secrets-stat-icon" />
              </Box>
              <Typography variant="body2" className="git-secrets-stat-date">
                {new Date(summary.scanTime).toLocaleDateString()}
              </Typography>
              <Typography variant="caption" className="git-secrets-stat-label">
                Last Scan
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters Section */}
      <Box className="git-secrets-filters-wrapper">
        <Box className="git-secrets-filters-controls">
            <TextField
              size="small"
              placeholder="Search by file, rule, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon className="git-secrets-search-icon" />
                  </InputAdornment>
                ),
              }}
              className="git-secrets-search-field"
            />
            
            <FormControl size="small" className="git-secrets-filter-select">
              <InputLabel>Severity</InputLabel>
              <Select
                value={severityFilter}
                label="Severity"
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <MenuItem value="all">All Severities</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" className="git-secrets-filter-select">
              <InputLabel>Rule Type</InputLabel>
              <Select
                value={ruleFilter}
                label="Rule Type"
                onChange={(e) => setRuleFilter(e.target.value)}
              >
                <MenuItem value="all">All Rules</MenuItem>
                {uniqueRules.map(rule => (
                  <MenuItem key={rule} value={rule}>{rule}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Tooltip title={showSecrets ? "Hide Secrets" : "Show Secrets"}>
              <IconButton
                onClick={() => setShowSecrets(!showSecrets)}
                className={`git-secrets-visibility-btn ${showSecrets ? 'git-secrets-visibility-btn-active' : ''}`}
                size="small"
              >
                {showSecrets ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

      {/* Results Section */}
      {filteredFindings.length === 0 ? (
        <Card className="git-secrets-empty-card">
          <CardContent className="git-secrets-empty-content">
            <Box className="git-secrets-empty-icon-wrapper">
              {findings.length === 0 ? (
                <CheckCircleIcon className="git-secrets-empty-icon git-secrets-empty-icon-success" />
              ) : (
                <SearchIcon className="git-secrets-empty-icon git-secrets-empty-icon-search" />
              )}
            </Box>
            <Typography variant="h5" className="git-secrets-empty-title">
              {findings.length === 0 ? "No Secrets Detected" : "No Matching Results"}
            </Typography>
            <Typography variant="body1" className="git-secrets-empty-subtitle">
              {findings.length === 0 
                ? "Your repository appears to be clean of exposed credentials and sensitive data."
                : "Try adjusting your search criteria or filters to find what you're looking for."
              }
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card className="git-secrets-results-card">
          <CardContent className="git-secrets-results-content">
            <Box className="git-secrets-results-header">
              <Box className="git-secrets-results-header-left">
                <LockIcon className="git-secrets-results-icon" />
                <Typography variant="h6" className="git-secrets-results-title">
                  Detected Secrets
                </Typography>
                <Chip 
                  label={`${filteredFindings.length} findings`}
                  size="small"
                  className="git-secrets-results-count-chip"
                />
              </Box>
            </Box>
            <Divider className="git-secrets-results-divider" />
            <TableContainer className="git-secrets-table-container">
              <Table className="git-secrets-table">
                <TableHead>
                  <TableRow className="git-secrets-table-header-row">
                    <TableCell className="git-secrets-table-header-cell">
                      <Box className="git-secrets-header-cell-content">
                        <FolderOpenIcon className="git-secrets-header-cell-icon" />
                        File Path
                      </Box>
                    </TableCell>
                    <TableCell className="git-secrets-table-header-cell">
                      <Box className="git-secrets-header-cell-content">
                        <CodeIcon className="git-secrets-header-cell-icon" />
                        Line
                      </Box>
                    </TableCell>
                    <TableCell className="git-secrets-table-header-cell">
                      <Box className="git-secrets-header-cell-content">
                        <DescriptionIcon className="git-secrets-header-cell-icon" />
                        Rule Type
                      </Box>
                    </TableCell>
                    <TableCell className="git-secrets-table-header-cell">
                      <Box className="git-secrets-header-cell-content">
                        <LockIcon className="git-secrets-header-cell-icon" />
                        Detected Content
                      </Box>
                    </TableCell>
                    <TableCell className="git-secrets-table-header-cell">
                      <Box className="git-secrets-header-cell-content">
                        <TrendingUpIcon className="git-secrets-header-cell-icon" />
                        Severity
                      </Box>
                    </TableCell>
                    <TableCell className="git-secrets-table-header-cell git-secrets-table-header-cell-actions">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedFindings.map((finding, index) => {
                    const rowKey = `${finding.file}:${finding.line}:${finding.rule}:${page}:${index}`;
                    const isExpanded = expandedRows.has(rowKey);
                    return (
                      <React.Fragment key={rowKey}>
                        <TableRow className={`git-secrets-table-row ${isExpanded ? 'git-secrets-table-row-expanded' : ''}`}>
                          <TableCell className="git-secrets-table-cell git-secrets-file-cell">
                            <Tooltip title={finding.file} placement="top">
                              <Typography variant="body2" className="git-secrets-file-path">
                                {finding.file}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="git-secrets-table-cell git-secrets-line-cell">
                            <Chip 
                              label={finding.line} 
                              size="small" 
                              variant="outlined"
                              className="git-secrets-line-chip"
                            />
                          </TableCell>
                          <TableCell className="git-secrets-table-cell git-secrets-rule-cell">
                            <Chip 
                              label={finding.rule} 
                              size="small" 
                              color="primary"
                              className="git-secrets-rule-chip"
                            />
                          </TableCell>
                          <TableCell className="git-secrets-table-cell git-secrets-content-cell">
                            <Box className="git-secrets-content-wrapper">
                              <Typography variant="body2" className="git-secrets-content-text">
                                {maskSecret(finding.content)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell className="git-secrets-table-cell git-secrets-severity-cell">
                            <Chip 
                              label={finding.severity} 
                              size="small" 
                              color="error"
                              className="git-secrets-severity-chip"
                            />
                          </TableCell>
                          <TableCell className="git-secrets-table-cell git-secrets-actions-cell">
                            <Tooltip title={isExpanded ? "Hide Details" : "Show Details"}>
                              <IconButton 
                                size="small"
                                onClick={() => toggleRowExpansion(rowKey)}
                                className={`git-secrets-expand-btn ${isExpanded ? 'git-secrets-expand-btn-active' : ''}`}
                              >
                                <ExpandMoreIcon className="git-secrets-expand-icon" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow className="git-secrets-details-row">
                            <TableCell colSpan={6} className="git-secrets-details-cell">
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box className="git-secrets-details-container">
                                  <Box className="git-secrets-details-header">
                                    <SecurityIcon className="git-secrets-details-header-icon" />
                                    <Typography variant="h6" className="git-secrets-details-header-title">
                                      Finding Details
                                    </Typography>
                                  </Box>
                                  <Divider className="git-secrets-details-divider" />
                                  <Grid container spacing={3} className="git-secrets-details-grid">
                                    <Grid item xs={12} md={6}>
                                      <Box className="git-secrets-detail-item">
                                        <Typography variant="caption" className="git-secrets-detail-label">
                                          File Path
                                        </Typography>
                                        <Typography variant="body2" className="git-secrets-detail-value git-secrets-detail-value-code">
                                          {finding.file}
                                        </Typography>
                                      </Box>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <Box className="git-secrets-detail-item">
                                        <Typography variant="caption" className="git-secrets-detail-label">
                                          Line Number
                                        </Typography>
                                        <Typography variant="body2" className="git-secrets-detail-value">
                                          {finding.line}
                                        </Typography>
                                      </Box>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <Box className="git-secrets-detail-item">
                                        <Typography variant="caption" className="git-secrets-detail-label">
                                          Rule Type
                                        </Typography>
                                        <Typography variant="body2" className="git-secrets-detail-value">
                                          {finding.rule}
                                        </Typography>
                                      </Box>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <Box className="git-secrets-detail-item">
                                        <Typography variant="caption" className="git-secrets-detail-label">
                                          Severity Level
                                        </Typography>
                                        <Chip 
                                          label={finding.severity}
                                          size="small"
                                          color="error"
                                          className="git-secrets-detail-severity-chip"
                                        />
                                      </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                      <Box className="git-secrets-detail-item">
                                        <Typography variant="caption" className="git-secrets-detail-label">
                                          Detected Content
                                        </Typography>
                                        <Box className="git-secrets-detail-content-box">
                                          <Typography variant="body2" className="git-secrets-detail-content-text">
                                            {showSecrets ? finding.content : maskSecret(finding.content)}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </Grid>
                                    {finding.pattern && (
                                      <Grid item xs={12}>
                                        <Box className="git-secrets-detail-item">
                                          <Typography variant="caption" className="git-secrets-detail-label">
                                            Detection Pattern
                                          </Typography>
                                          <Box className="git-secrets-detail-pattern-box">
                                            <Typography variant="body2" className="git-secrets-detail-pattern-text">
                                              {finding.pattern}
                                            </Typography>
                                          </Box>
                                        </Box>
                                      </Grid>
                                    )}
                                  </Grid>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Divider className="git-secrets-pagination-divider" />
            <TablePagination
              component="div"
              count={filteredFindings.length}
              page={page}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
              className="git-secrets-pagination"
            />
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
