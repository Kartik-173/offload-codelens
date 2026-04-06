import React, { useMemo, useState } from "react";
import {
  Download as DownloadIcon,
  Filter as FilterListIcon,
  Search as SearchIcon,
  ArrowUpCircle as UpgradeIcon,
  Puzzle as ExtensionIcon,
  ArrowUp as ArrowUpwardIcon,
  ArrowDown as ArrowDownwardIcon,
  X,
} from "lucide-react";

const Box = ({ children, className = "", component = "div", sx, ...rest }) => {
  const Tag = component === "span" ? "span" : "div";
  return (
    <Tag className={className} {...rest}>
      {children}
    </Tag>
  );
};

const Paper = ({ children, className = "", sx, ...rest }) => (
  <div className={className} {...rest}>{children}</div>
);

const Typography = ({ children, className = "", component = "p", sx, ...rest }) => {
  const Tag = component;
  return (
    <Tag className={className} {...rest}>{children}</Tag>
  );
};

const Table = ({ children, className = "", ...rest }) => (
  <table className={`w-full text-sm ${className}`.trim()} {...rest}>{children}</table>
);
const TableHead = ({ children, ...rest }) => <thead {...rest}>{children}</thead>;
const TableBody = ({ children, ...rest }) => <tbody {...rest}>{children}</tbody>;
const TableRow = ({ children, className = "", ...rest }) => <tr className={className} {...rest}>{children}</tr>;
const TableCell = ({ children, className = "", align, colSpan, sx, ...rest }) => (
  <td
    className={`px-3 py-2 ${align === "center" ? "text-center" : "text-left"} ${className}`.trim()}
    colSpan={colSpan}
    {...rest}
  >
    {children}
  </td>
);

const Stack = ({ children, direction, spacing, className = "", ...rest }) => (
  <div className={`flex flex-wrap items-center gap-2 ${className}`.trim()} {...rest}>{children}</div>
);

const InputAdornment = ({ children }) => <span className="inline-flex items-center">{children}</span>;

const MenuItem = ({ children, value }) => <option value={value}>{children}</option>;

const Select = ({ value, onChange, children, className = "", ...rest }) => (
  <select
    value={value}
    onChange={onChange}
    className={`h-9 rounded-md border border-input bg-background px-3 text-sm ${className}`.trim()}
    {...rest}
  >
    {children}
  </select>
);

const InputLabel = ({ children }) => <span className="text-xs text-slate-500">{children}</span>;
const FormControl = ({ children, className = "" }) => <div className={className}>{children}</div>;

const TextField = ({
  select,
  value,
  onChange,
  children,
  placeholder,
  className = "",
  InputProps,
  ...rest
}) => {
  if (select) {
    return (
      <Select value={value} onChange={onChange} className={className} {...rest}>
        {children}
      </Select>
    );
  }

  return (
    <div className="relative">
      {InputProps?.startAdornment && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          {InputProps.startAdornment}
        </span>
      )}
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`h-9 rounded-md border border-input bg-background px-3 text-sm ${InputProps?.startAdornment ? "pl-9" : ""} ${className}`.trim()}
      />
    </div>
  );
};

const ToggleButton = ({ children, value, groupValue = [], onGroupChange, className = "", ...rest }) => {
  const selected = groupValue.includes(value);

  return (
    <button
      type="button"
      className={`rounded-md border px-2 py-1 text-xs ${selected ? "bg-slate-900 text-white" : "bg-white text-slate-700"} ${className}`.trim()}
      onClick={() => {
        const next = selected ? groupValue.filter((v) => v !== value) : [...groupValue, value];
        onGroupChange?.(null, next);
      }}
      {...rest}
    >
      {children}
    </button>
  );
};

const ToggleButtonGroup = ({ children, value = [], onChange, className = "" }) => (
  <div className={`flex flex-wrap gap-1 ${className}`.trim()}>
    {React.Children.map(children, (child) =>
      React.isValidElement(child)
        ? React.cloneElement(child, { groupValue: value, onGroupChange: onChange })
        : child
    )}
  </div>
);

const Tooltip = ({ children, title }) => <span title={typeof title === "string" ? title : undefined}>{children}</span>;

const Chip = ({ label, className = "", onDelete }) => (
  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${className}`.trim()}>
    {label}
    {onDelete && (
      <button type="button" onClick={onDelete} className="rounded p-0.5 hover:bg-slate-100">
        <X className="h-3 w-3" />
      </button>
    )}
  </span>
);

const Button = ({ children, onClick, className = "", startIcon }) => (
  <button type="button" onClick={onClick} className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm ${className}`.trim()}>
    {startIcon}
    {children}
  </button>
);

const statusColor = (status) => {
  switch (status) {
    case "major":
      return "error";
    case "minor":
      return "warning";
    case "patch":
      return "info";
    case "upToDate":
      return "success";
    default:
      return "default";
  }
};

export default function GitReportView({ loading, reportDetails }) {
  const gitReport = reportDetails?.data?.gitReport || { packages: [], summary: {} };
  const packages = Array.isArray(gitReport.packages) ? gitReport.packages : [];
  const summary = gitReport.summary || { total: 0, outdated: 0, major: 0, minor: 0, patch: 0 };

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [ecosystemFilter, setEcosystemFilter] = useState("all"); // all | npm | pypi | php
  const [statusFilters, setStatusFilters] = useState(new Set());
  const [deprecatedOnly, setDeprecatedOnly] = useState(false);
  const [sortKey, setSortKey] = useState("severity"); // severity | name | current | compatible | latest | type
  const [sortDir, setSortDir] = useState("asc"); // asc | desc
  const toggleStatus = (s) => {
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  };

  const sorted = useMemo(() => {
    const weight = { deprecated: 0, major: 1, minor: 2, patch: 3, upToDate: 4, unknown: 5 };
    const arr = [...packages];
    const dir = sortDir === "desc" ? -1 : 1;
    const cmpStr = (x, y) => (x || "").localeCompare(y || "") * dir;
    const cmpSemverStr = cmpStr; // strings displayed; we don't parse into semver here
    arr.sort((a, b) => {
      if (sortKey === "severity") {
        const ea = a.deprecated ? 'deprecated' : (a.status || 'unknown');
        const eb = b.deprecated ? 'deprecated' : (b.status || 'unknown');
        const wa = weight[ea] ?? 9;
        const wb = weight[eb] ?? 9;
        if (wa !== wb) return (wa - wb) * dir;
        return cmpStr(a.name, b.name);
      }
      if (sortKey === "name") return cmpStr(a.name, b.name);
      if (sortKey === "current") return cmpSemverStr(a.current, b.current);
      if (sortKey === "compatible") return cmpSemverStr(a.compatible || a.wanted, b.compatible || b.wanted);
      if (sortKey === "latest") return cmpSemverStr(a.latest, b.latest);
      if (sortKey === "type") return cmpStr(a.type, b.type);
      return 0;
    });
    return arr;
  }, [packages, sortKey, sortDir]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sorted.filter((p) => {
      const eco = (p.ecosystem || 'npm').toLowerCase();
      if (q && !(p.name || "").toLowerCase().includes(q)) return false;
      if (typeFilter !== "all" && (p.type || "").toLowerCase() !== typeFilter) return false;
      if (ecosystemFilter !== 'all' && eco !== ecosystemFilter) return false;
      if (deprecatedOnly) {
        if (!p.deprecated) return false;
        // When deprecated-only is active, ignore severity filters entirely
      } else {
        if (statusFilters.size > 0 && !statusFilters.has(p.status || "unknown")) return false;
      }
      return true;
    });
  }, [sorted, search, typeFilter, ecosystemFilter, statusFilters, deprecatedOnly]);

  const onHeaderSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "severity" ? "asc" : "asc");
    }
  };

  const exportCSV = () => {
    const rows = filtered.map((p) => ({
      name: p.name,
      current: p.current,
      compatible: p.compatible || p.wanted || "",
      latest: p.latest || "",
      type: p.type,
      severity: p.deprecated ? "Deprecated" : (p.status || "unknown").replace("upToDate", "Up-to-date"),
      deprecated: p.deprecated ? "yes" : "no",
      packageJsonPath: p.packageJsonPath || "",
    }));
    const header = Object.keys(rows[0] || { name: "name", current: "current", compatible: "compatible", latest: "latest", type: "type", severity: "severity", deprecated: "deprecated", packageJsonPath: "packageJsonPath" });
    const csv = [header.join(",")]
      .concat(
        rows.map((r) => header.map((k) => String(r[k] ?? "").replaceAll('"', '""')).map((v) => /[",\n]/.test(v) ? `"${v}"` : v).join(","))
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `insights_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Derive counts for all packages (not filtered) so header always reflects full dataset
  const counts = useMemo(() => {
    const c = { total: packages.length, major: 0, minor: 0, patch: 0, upToDate: 0, unknown: 0, deprecated: 0 };
    for (const p of packages) {
      const s = p.status || 'unknown';
      if (s === 'major') c.major++;
      else if (s === 'minor') c.minor++;
      else if (s === 'patch') c.patch++;
      else if (s === 'upToDate') c.upToDate++;
      else c.unknown++;
      if (p.deprecated) c.deprecated++;
    }
    c.outdated = c.major + c.minor + c.patch;
    return c;
  }, [packages]);

  return (
    <Box className="git-report-wrapper" sx={{ fontFamily: 'Inter, "Segoe UI", system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif' }}>
      <Paper className="git-report-summary" elevation={2} sx={{ p: 0, mb: 2, overflow: 'hidden' }}>

        <Box sx={{ p: 2 }}>
          {/* Dependency Health summary boxes (clickable) */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <Paper onClick={() => { setStatusFilters(new Set()); setTypeFilter("all"); setDeprecatedOnly(false); setSortKey("severity"); setSortDir("asc"); }} role="button" variant="outlined" sx={{ cursor: 'pointer', flex: 1, p: 2, borderRadius: 2, borderColor: 'divider', '&:hover': { boxShadow: 2 } }}>
              <Typography variant="body2" color="text.secondary">Total Dependencies</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{counts.total}</Typography>
            </Paper>
            <Paper onClick={() => { setStatusFilters(new Set(["major","minor","patch"])); setDeprecatedOnly(false); }} role="button" variant="outlined" sx={{ cursor: 'pointer', flex: 1, p: 2, borderRadius: 2, bgcolor: (t) => t.palette.warning[50] || 'rgba(251, 191, 36, 0.08)', borderColor: 'warning.light', '&:hover': { boxShadow: 2 } }}>
              <Typography variant="body2" color="warning.dark">Outdated</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.dark' }}>{counts.outdated}</Typography>
            </Paper>
            <Paper onClick={() => { setDeprecatedOnly(true); setStatusFilters(new Set()); }} role="button" variant="outlined" sx={{ cursor: 'pointer', flex: 1, p: 2, borderRadius: 2, bgcolor: (t) => t.palette.success[50] || 'rgba(16, 185, 129, 0.08)', borderColor: 'success.light', '&:hover': { boxShadow: 2 } }}>
              <Typography variant="body2" color="success.dark">Deprecated</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.dark' }}>{counts.deprecated}</Typography>
            </Paper>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
            <TextField
              size="small"
              placeholder="Search package"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 280 }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="type-filter">Type</InputLabel>
              <Select labelId="type-filter" label="Type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="dependency">Dependencies</MenuItem>
                <MenuItem value="devdependency">Dev Dependencies</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="ecosystem-filter">Ecosystem</InputLabel>
              <Select
                labelId="ecosystem-filter"
                label="Ecosystem"
                value={ecosystemFilter}
                onChange={(e) => setEcosystemFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="npm">npm</MenuItem>
                <MenuItem value="pypi">PyPI</MenuItem>
                <MenuItem value="php">PHP</MenuItem>
                <MenuItem value="gomod">Go</MenuItem>
              </Select>
            </FormControl>
            <ToggleButtonGroup
              size="small"
              value={[...statusFilters]}
              onChange={(_, values) => setStatusFilters(new Set(values))}
              aria-label="severity filters"
              color="primary"
            >
              <Tooltip title="Major: New major version available (may include breaking changes)"><ToggleButton value="major" aria-label="major" sx={{ textTransform: 'none', borderColor: 'error.light', color: 'error.main', '&.Mui-selected': { bgcolor: 'error.light', color: 'error.contrastText' } }}>Major {counts.major}{statusFilters.has('major') ? ' ✕' : ''}</ToggleButton></Tooltip>
              <Tooltip title="Minor: New minor version available (new features, backwards compatible)"><ToggleButton value="minor" aria-label="minor" sx={{ textTransform: 'none', borderColor: 'warning.light', color: 'warning.dark', '&.Mui-selected': { bgcolor: 'warning.light', color: 'warning.contrastText' } }}>Minor {counts.minor}{statusFilters.has('minor') ? ' ✕' : ''}</ToggleButton></Tooltip>
              <Tooltip title="Patch: Bug fixes or small improvements available"><ToggleButton value="patch" aria-label="patch" sx={{ textTransform: 'none', borderColor: 'info.light', color: 'info.main', '&.Mui-selected': { bgcolor: 'info.light', color: 'info.contrastText' } }}>Patch {counts.patch}{statusFilters.has('patch') ? ' ✕' : ''}</ToggleButton></Tooltip>
              <Tooltip title="Up-to-date: You are already on the latest compatible version"><ToggleButton value="upToDate" aria-label="up to date" sx={{ textTransform: 'none', borderColor: 'success.light', color: 'success.main', '&.Mui-selected': { bgcolor: 'success.light', color: 'success.contrastText' } }}>Up‑to‑date {counts.upToDate}{statusFilters.has('upToDate') ? ' ✕' : ''}</ToggleButton></Tooltip>
              <Tooltip title="Unknown: Could not determine version info (network or registry issues)"><ToggleButton value="unknown" aria-label="unknown" sx={{ textTransform: 'none', color: 'text.secondary', '&.Mui-selected': { bgcolor: 'grey.300', color: 'grey.900' } }}>Unknown {counts.unknown}</ToggleButton></Tooltip>
            </ToggleButtonGroup>
            <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={exportCSV} sx={{ ml: 'auto' }}>
              Export CSV
            </Button>
          </Stack>
          {deprecatedOnly && (
            <Box sx={{ mt: 1 }}>
              <Chip size="small" color="warning" label="Deprecated only active" onDelete={() => setDeprecatedOnly(false)} />
            </Box>
          )}
        </Box>
      </Paper>

      <Paper elevation={1}>
        <Box sx={{ maxHeight: 520, overflow: 'auto' }}>
          <Table size="small" stickyHeader sx={{
            '& thead th': { fontWeight: 700, fontSize: '0.95rem' },
            '& td, & th': { whiteSpace: 'nowrap', fontSize: '0.92rem' },
            '& tbody tr:nth-of-type(odd)': { backgroundColor: 'action.hover' },
          }}>
            <TableHead>
              <TableRow>
                <TableCell onClick={() => onHeaderSort('index')} sx={{ position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1, width: 64, cursor: 'pointer' }}>S. No</TableCell>
                <TableCell onClick={() => onHeaderSort('name')} sx={{ position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1, minWidth: 220, maxWidth: 360, cursor: 'pointer' }}>
                  Package {sortKey==='name' && (sortDir==='asc' ? <ArrowUpwardIcon fontSize="inherit" sx={{ verticalAlign: 'middle', ml: 0.5, opacity: 0.8 }} /> : <ArrowDownwardIcon fontSize="inherit" sx={{ verticalAlign: 'middle', ml: 0.5, opacity: 0.8 }} />)}
                </TableCell>
                <TableCell onClick={() => onHeaderSort('current')} sx={{ position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1, cursor: 'pointer' }}>
                  Current {sortKey==='current' && (sortDir==='asc' ? <ArrowUpwardIcon fontSize="inherit" sx={{ verticalAlign: 'middle', ml: 0.5, opacity: 0.8 }} /> : <ArrowDownwardIcon fontSize="inherit" sx={{ verticalAlign: 'middle', ml: 0.5, opacity: 0.8 }} />)}
                </TableCell>
                <TableCell onClick={() => onHeaderSort('compatible')} sx={{ position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1, cursor: 'pointer' }}>Compatible
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                    <Tooltip title="Highest version that matches your declared range in package.json (safe update)">ⓘ</Tooltip>
                  </Typography>
                  {sortKey==='compatible' && (sortDir==='asc' ? <ArrowUpwardIcon fontSize="inherit" sx={{ verticalAlign: 'middle', ml: 0.5, opacity: 0.8 }} /> : <ArrowDownwardIcon fontSize="inherit" sx={{ verticalAlign: 'middle', ml: 0.5, opacity: 0.8 }} />)}
                </TableCell>
                <TableCell onClick={() => onHeaderSort('latest')} sx={{ position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1, cursor: 'pointer' }}>
                  Latest {sortKey==='latest' && (sortDir==='asc' ? <ArrowUpwardIcon fontSize="inherit" sx={{ verticalAlign: 'middle', ml: 0.5, opacity: 0.8 }} /> : <ArrowDownwardIcon fontSize="inherit" sx={{ verticalAlign: 'middle', ml: 0.5, opacity: 0.8 }} />)}
                </TableCell>
                <TableCell onClick={() => onHeaderSort('type')} sx={{ position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1, cursor: 'pointer' }}>Type
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                    <Tooltip title="Dependency type: production (Dependencies) or development (Dev Dependencies)">ⓘ</Tooltip>
                  </Typography>
                  {sortKey==='type' && (sortDir==='asc' ? <ArrowUpwardIcon fontSize="inherit" sx={{ verticalAlign: 'middle', ml: 0.5, opacity: 0.8 }} /> : <ArrowDownwardIcon fontSize="inherit" sx={{ verticalAlign: 'middle', ml: 0.5, opacity: 0.8 }} />)}
                </TableCell>
                <TableCell align="center" onClick={() => onHeaderSort('severity')} sx={{ position: 'sticky', top: 0, backgroundColor: 'background.paper', zIndex: 1, cursor: 'pointer' }}>
                  Severity
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                    <Tooltip title="Shows Deprecated if the package is deprecated; otherwise how far behind: Major, Minor, Patch, or Up‑to‑date">ⓘ</Tooltip>
                  </Typography>
                  {sortKey==='severity' && (sortDir==='asc' ? <ArrowUpwardIcon fontSize="inherit" sx={{ verticalAlign: 'middle', ml: 0.5, opacity: 0.8 }} /> : <ArrowDownwardIcon fontSize="inherit" sx={{ verticalAlign: 'middle', ml: 0.5, opacity: 0.8 }} />)}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((p, idx) => (
                <TableRow key={`${p.name}-${idx}`} hover>
                  <TableCell sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>
                  <TableCell sx={{ maxWidth: 360 }}>
                    <Tooltip title={p.name || ''} placement="top" arrow>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {p.homepage ? (
                          <a
                            href={p.homepage}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: 'var(--link-color, #1d4ed8)',
                              textDecoration: 'none',
                              maxWidth: 300,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'inline-block',
                            }}
                          >
                            {p.name}
                          </a>
                        ) : (
                          <span
                            style={{
                              color: 'var(--link-color, #1f2937)',
                              maxWidth: 300,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'inline-block',
                            }}
                          >
                            {p.name}
                          </span>
                        )}
                        <Chip
                          size="small"
                          variant="outlined"
                          label={(p.ecosystem || 'npm').toUpperCase()}
                          sx={{ fontSize: '0.65rem', height: 18, textTransform: 'uppercase' }}
                        />
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 140 }}>
                    <Tooltip title={p.current || "-"} placement="top" arrow>
                      <span
                        style={{
                          fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                          maxWidth: 130,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'inline-block',
                        }}
                      >
                        {p.current || "-"}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 140 }}>
                    <Tooltip title={p.compatible || p.wanted || "-"} placement="top" arrow>
                      <span
                        style={{
                          fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                          maxWidth: 130,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'inline-block',
                        }}
                      >
                        {p.compatible || p.wanted || "-"}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 140 }}>
                    <Tooltip title={p.latest || "-"} placement="top" arrow>
                      <span
                        style={{
                          fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                          maxWidth: 130,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'inline-block',
                        }}
                      >
                        {p.latest || "-"}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ textTransform: 'capitalize', color: 'text.secondary' }}>
                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, whiteSpace: 'nowrap' }}>
                      {p.type || "-"}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={p.deprecated ? 'Deprecated' : (p.status || 'unknown').replace('upToDate','Up-to-date')}
                      sx={(theme) => {
                        const s = p.deprecated ? 'deprecated' : (p.status || 'unknown');
                        const styles = {
                          deprecated: { bg: theme.palette.warning.dark, fg: theme.palette.getContrastText(theme.palette.warning.dark) },
                          major: { bg: theme.palette.error.light, fg: theme.palette.error.contrastText },
                          minor: { bg: theme.palette.warning.light, fg: theme.palette.warning.contrastText },
                          patch: { bg: theme.palette.info.light, fg: theme.palette.info.contrastText },
                          upToDate: { bg: theme.palette.success.light, fg: theme.palette.success.contrastText },
                          unknown: { bg: theme.palette.grey[200], fg: theme.palette.text.primary },
                        }[s] || { bg: theme.palette.grey[200], fg: theme.palette.text.primary };
                        return {
                          backgroundColor: styles.bg,
                          color: styles.fg,
                          fontWeight: 700,
                          textTransform: 'none',
                          borderRadius: '999px',
                        };
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Typography variant="body2" color="textSecondary">
                      No packages match the filters
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>
    </Box>
  );
}
