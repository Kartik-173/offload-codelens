import React, { useEffect, useMemo, useState } from "react";
import {
  Package as Inventory2Icon,
  TriangleAlert as WarningAmberIcon,
  ShieldAlert as SecurityIcon,
  Shield as ShieldIcon,
  Flame as LocalFireDepartmentIcon,
  CircleAlert as ErrorOutlineIcon,
  AlertTriangle as ReportProblemIcon,
  Info as InfoOutlinedIcon,
  Link2 as LinkIcon,
  ChevronDown as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
} from "lucide-react";

const Box = ({ children, className = "", ...props }) => (
  <div className={className} {...props}>{children}</div>
);

const Card = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const CardContent = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const Typography = ({ children, className = "", ...props }) => (
  <p className={className} {...props}>{children}</p>
);

const Grid = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const Tooltip = ({ children, title }) => (
  <span title={typeof title === "string" ? title : undefined}>{children}</span>
);

const Chip = ({ label, className = "", icon, ...props }) => (
  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${className}`.trim()} {...props}>
    {icon}
    {label}
  </span>
);

const IconButton = ({ children, className = "", onClick }) => (
  <button type="button" className={className} onClick={onClick}>{children}</button>
);

const Collapse = ({ in: open, children }) => (open ? <>{children}</> : null);

const Divider = ({ className = "" }) => <div className={className} />;

const CircularProgress = ({ size = 40 }) => (
  <div
    className="animate-spin rounded-full border-2 border-slate-300 border-t-slate-700"
    style={{ width: size, height: size }}
  />
);

export default function CVEView({ loading, cveReport }) {
  const [expandedPkg, setExpandedPkg] = useState({});
  const [expandedVuln, setExpandedVuln] = useState({});

  const items = useMemo(
    () => (Array.isArray(cveReport?.items) ? cveReport.items : []),
    [cveReport]
  );

  const firstPkgKey = useMemo(() => {
    if (!items.length) return null;
    const first = items[0];
    return `${first.name}@${first.version}`;
  }, [items]);

  const reportKey = useMemo(() => {
    const s = cveReport?.summary;
    if (!s) return "no-report";
    return `${s.totalPackages}-${s.totalVulns}-${items[0]?.name || ""}-${items[0]?.version || ""}`;
  }, [cveReport, items]);

  useEffect(() => {
    // Reset expansion when switching to a different report, and open the first package by default
    if (!firstPkgKey) {
      setExpandedPkg({});
      setExpandedVuln({});
      return;
    }
    setExpandedPkg({ [firstPkgKey]: true });
    setExpandedVuln({});
  }, [reportKey, firstPkgKey]);

  if (loading) {
    return (
      <Box className="cve-loading">
        <CircularProgress size={40} />
        <Typography variant="body2">Loading CVE data...</Typography>
      </Box>
    );
  }

  const togglePackage = (pkgKey) => {
    setExpandedPkg((prev) => ({ ...prev, [pkgKey]: !prev[pkgKey] }));
  };

  const toggleVuln = (vulnKey) => {
    setExpandedVuln((prev) => ({ ...prev, [vulnKey]: !prev[vulnKey] }));
  };

  const summary = cveReport?.summary || {
    totalPackages: 0,
    affectedPackages: 0,
    totalVulns: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  return (
    <Box className="cve-view">
      <Box className="cve-summary-wrap">
        <Grid container spacing={2} className="cve-summary-grid">
          <Grid size={{ xs: 12, md: 6, lg: 3 }}>
            <Card className="cve-summary-card">
              <CardContent className="cve-summary-card-content">
                <Tooltip title="Total packages detected from package.json" arrow>
                  <Box className="cve-card-icon-wrapper">
                    <Inventory2Icon className="cve-card-icon cve-icon-primary" />
                  </Box>
                </Tooltip>
                <Typography variant="h6" className="cve-card-title">Packages</Typography>
                <Typography variant="h3" className="cve-card-value">{summary.totalPackages}</Typography>
              </CardContent>
            </Card>
          </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card className="cve-summary-card cve-card-affected">
            <CardContent className="cve-summary-card-content">
              <Tooltip title="Packages that have at least one vulnerability" arrow>
                <Box className="cve-card-icon-wrapper">
                  <WarningAmberIcon className="cve-card-icon cve-icon-warning" />
                </Box>
              </Tooltip>
              <Typography variant="h6" className="cve-card-title">Affected</Typography>
              <Typography variant="h3" className="cve-card-value">{summary.affectedPackages}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card className="cve-summary-card cve-card-vulns">
            <CardContent className="cve-summary-card-content">
              <Tooltip title="Total vulnerabilities found across all packages" arrow>
                <Box className="cve-card-icon-wrapper">
                  <SecurityIcon className="cve-card-icon cve-icon-danger" />
                </Box>
              </Tooltip>
              <Typography variant="h6" className="cve-card-title">Vulnerabilities</Typography>
              <Typography variant="h3" className="cve-card-value">{summary.totalVulns}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card className="cve-summary-card cve-card-severity">
            <CardContent className="cve-summary-card-content">
              <Tooltip title="Severity distribution of vulnerabilities" arrow>
                <Box className="cve-card-icon-wrapper">
                  <ShieldIcon className="cve-card-icon cve-icon-shield" />
                </Box>
              </Tooltip>
              <Typography variant="h6" className="cve-card-title">Severity</Typography>
              <Box className="cve-severity-row">
                {summary.critical > 0 && (
                  <Tooltip title="Critical vulnerabilities (CVSS 9.0 - 10.0)" arrow>
                    <span>
                      <Chip label={`${summary.critical}`} size="small" className="sev-chip sev-chip-critical" icon={<LocalFireDepartmentIcon className="sev-chip-icon" />} />
                    </span>
                  </Tooltip>
                )}
                {summary.high > 0 && (
                  <Tooltip title="High vulnerabilities (CVSS 7.0 - 8.9)" arrow>
                    <span>
                      <Chip label={`${summary.high}`} size="small" className="sev-chip sev-chip-high" icon={<ErrorOutlineIcon className="sev-chip-icon" />} />
                    </span>
                  </Tooltip>
                )}
                {summary.medium > 0 && (
                  <Tooltip title="Medium vulnerabilities (CVSS 4.0 - 6.9)" arrow>
                    <span>
                      <Chip label={`${summary.medium}`} size="small" className="sev-chip sev-chip-medium" icon={<ReportProblemIcon className="sev-chip-icon" />} />
                    </span>
                  </Tooltip>
                )}
                {summary.low > 0 && (
                  <Tooltip title="Low vulnerabilities (CVSS 0.1 - 3.9)" arrow>
                    <span>
                      <Chip label={`${summary.low}`} size="small" className="sev-chip sev-chip-low" icon={<InfoOutlinedIcon className="sev-chip-icon" />} />
                    </span>
                  </Tooltip>
                )}
                {summary.totalVulns === 0 && (
                  <Tooltip title="No vulnerabilities detected" arrow>
                    <span>
                      <Chip label="None" size="small" className="sev-chip sev-chip-none" icon={<CheckCircleIcon />} />
                    </span>
                  </Tooltip>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        </Grid>
      </Box>

      <Box className="cve-list">
        {items.length === 0 ? (
          <Card className="cve-empty">
            <CardContent className="cve-empty-content">
              <CheckCircleIcon className="cve-empty-icon" />
              <Typography variant="h6">No CVEs detected</Typography>
              <Typography variant="body2">All Node.js dependencies are secure.</Typography>
            </CardContent>
          </Card>
        ) : (
          items.map((pkg, pkgIdx) => {
            const pkgKey = `${pkg.name}@${pkg.version}`;
            const isPkgExpanded = !!expandedPkg[pkgKey];
            return (
              <Card key={pkgKey} className="cve-item">
                <Box
                  className="cve-item-header"
                  role="button"
                  tabIndex={0}
                  onClick={() => togglePackage(pkgKey)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePackage(pkgKey); } }}
                >
                  <Box className="cve-item-header-left">
                    <Inventory2Icon className="cve-pkg-icon" />
                    <Box className="cve-item-title-group">
                      <Typography variant="h6" className="cve-pkg-name">{pkg.name}</Typography>
                      <Typography variant="body2" className="cve-item-version">v{pkg.version}</Typography>
                    </Box>
                  </Box>
                  <Box className="cve-item-header-right">
                    <Chip 
                      label={`${pkg.count} vuln${pkg.count !== 1 ? 's' : ''}`} 
                      size="small" 
                      className="cve-vuln-count-chip"
                      color="error"
                      variant="outlined"
                    />
                    <Tooltip title={isPkgExpanded ? "Collapse package" : "Expand package"} arrow>
                      <IconButton 
                        className={`cve-expand-btn ${isPkgExpanded ? 'cve-expand-btn-open' : ''}`}
                        size="small"
                        onClick={(e) => { e.stopPropagation(); togglePackage(pkgKey); }}
                      >
                        <ExpandMoreIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Collapse in={isPkgExpanded} timeout="auto" unmountOnExit>
                  <Divider className="cve-item-divider" />
                  <Box className="cve-vuln-list">
                    {pkg.vulnerabilities.map((v, vIdx) => {
                      const vulnKey = `${pkgKey}-${v.id}`;
                      const isVulnExpanded = !!expandedVuln[vulnKey];
                      const cveAlias = Array.isArray(v.aliases) ? v.aliases.find((a) => a.startsWith('CVE-')) : null;
                      return (
                        <Box key={v.id} className="cve-vuln-row">
                          <Box
                            className="cve-vuln-header"
                            role="button"
                            tabIndex={0}
                            onClick={() => toggleVuln(vulnKey)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleVuln(vulnKey); } }}
                          >
                            <Box className="cve-vuln-header-left">
                              <span className={`sev-dot sev-${String(v.severity || 'UNKNOWN').toLowerCase()}`} />
                              <Box className="cve-vuln-title-group">
                                <Typography variant="body1" className="cve-vuln-id">{v.id}</Typography>
                                {cveAlias && (
                                  <Chip size="small" variant="outlined" label={cveAlias} className="cve-id-chip" />
                                )}
                              </Box>
                            </Box>
                            <Tooltip title={isVulnExpanded ? "Hide details" : "Show details"} arrow>
                              <IconButton 
                                className={`cve-vuln-expand-btn ${isVulnExpanded ? 'cve-vuln-expand-btn-open' : ''}`}
                                size="small"
                                onClick={(e) => { e.stopPropagation(); toggleVuln(vulnKey); }}
                              >
                                <ExpandMoreIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          {v.summary && (
                            <Typography variant="body2" className="cve-vuln-summary">{v.summary}</Typography>
                          )}
                          <Collapse in={isVulnExpanded} timeout="auto" unmountOnExit>
                            {Array.isArray(v.references) && v.references.length > 0 && (
                              <Box className="cve-refs">
                                <Typography variant="caption" className="cve-refs-title">
                                  <LinkIcon className="cve-refs-icon" />
                                  References:
                                </Typography>
                                <Box className="cve-refs-list">
                                  {v.references.slice(0, 5).map((r, i) => (
                                    <a key={i} href={r.url} target="_blank" rel="noreferrer" className="cve-ref-link">
                                      <Tooltip title={r.url} arrow>
                                        <span>
                                          <Chip 
                                            label={r.type || `Ref ${i + 1}`} 
                                            size="small" 
                                            variant="outlined"
                                            className="cve-ref-chip"
                                            clickable
                                          />
                                        </span>
                                      </Tooltip>
                                    </a>
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </Collapse>
                        </Box>
                      );
                    })}
                  </Box>
                </Collapse>
              </Card>
            );
          })
        )}
      </Box>
    </Box>
  );
}
