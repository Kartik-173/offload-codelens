import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Button,
  TablePagination,
  IconButton,
  Paper,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Menu,
  Checkbox,
  TextField,
  ListItemText,
  Divider,
  Skeleton,
} from '@mui/material';
import AzureScanApiService from '../services/AzureScanApiService';
import CredentialsApiService from '../services/CredentialsApiService';
import SnackbarNotification, { SNACKBAR_THEME } from '../components/common/SnackbarNotification';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import FilterListIcon from '@mui/icons-material/FilterList';
import DensityMediumIcon from '@mui/icons-material/DensityMedium';
import GetAppIcon from '@mui/icons-material/GetApp';
import Grid from '@mui/material/Grid';
import CloseIcon from '@mui/icons-material/Close';

const AzureScan = () => {
  const [isTriggerLoading, setIsTriggerLoading] = useState(false);
  const [isReportListLoading, setIsReportListLoading] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);

  const [tenantIdsLoading, setTenantIdsLoading] = useState(false);
  const [tenantIds, setTenantIds] = useState([]);
  const [tenantOptions, setTenantOptions] = useState([]);
  const [selectedTenantId, setSelectedTenantId] = useState('');

  const [reportList, setReportList] = useState([]);
  const [selectedOpenSearchId, setSelectedOpenSearchId] = useState('');
  const [rawReport, setRawReport] = useState(null);

  const [snackbarType, setSnackbarType] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isScanAvailable, setIsScanAvailable] = useState(true);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [columnsAnchorEl, setColumnsAnchorEl] = useState(null);
  const [columnSearch, setColumnSearch] = useState('');
  const [visibleColumns, setVisibleColumns] = useState({
    status: true,
    severity: true,
    serviceName: true,
    region: true,
    checkId: true,
    checkTitle: true,
    resourceId: true,
    resourceTags: true,
    statusExtended: true,
    risk: true,
    recommendation: true,
    compliance: true,
  });

  const [isFilterBarOpen, setIsFilterBarOpen] = useState(false);
  const [filterColumn, setFilterColumn] = useState('status');
  const [filterOperator, setFilterOperator] = useState('contains');
  const [filterValue, setFilterValue] = useState('');

  const [densityAnchorEl, setDensityAnchorEl] = useState(null);
  const [tableDensity, setTableDensity] = useState('standard');
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const loadTenantIds = async () => {
      if (!userId) {
        setTenantIds([]);
        setTenantOptions([]);
        setSelectedTenantId('');
        return;
      }

      try {
        setTenantIdsLoading(true);
        const res = await CredentialsApiService.listAzureTenantIds(userId);

        const payload = res?.data?.data || res?.data || {};
        const ids = payload.tenantIds || [];
        const tenants = Array.isArray(payload.tenants) ? payload.tenants : null;

        const normalized = ids.map((id) => String(id));
        const normalizedOptions = tenants
          ? tenants
              .map((t) => ({
                tenantId: String(t?.tenantId ?? t?.id ?? ''),
                name: t?.name || '',
              }))
              .filter((t) => t.tenantId)
          : normalized.map((tenantId) => ({ tenantId, name: '' }));

        setTenantIds(normalized);
        setTenantOptions(normalizedOptions);
        setSelectedTenantId((prev) => {
          if (prev && normalized.includes(prev)) return prev;
          return normalized[0] || '';
        });
      } catch (err) {
        setTenantIds([]);
        setTenantOptions([]);
        setSelectedTenantId('');
        showSnackbar('error', 'Failed to load Azure tenant IDs. Please add Azure credentials first.');
      } finally {
        setTenantIdsLoading(false);
      }
    };

    loadTenantIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const findings = useMemo(() => {
    if (!rawReport) return [];
    return rawReport?._source?.parsedJson || [];
  }, [rawReport]);

  const densityCellSx = useMemo(() => {
    switch (tableDensity) {
      case 'compact':
        return { paddingTop: 1, paddingBottom: 1 };
      case 'comfortable':
        return { paddingTop: 3, paddingBottom: 3 };
      case 'standard':
        return { paddingTop: 2, paddingBottom: 2 };
      default:
        return { paddingTop: 1, paddingBottom: 1 };
    }
  }, [tableDensity]);

  const filteredFindings = useMemo(() => {
    if (!filterValue || !filterColumn) return findings;

    const search = filterValue.toLowerCase();

    const getFieldValue = (item) => {
      const resource = Array.isArray(item.Resources) && item.Resources.length > 0 ? item.Resources[0] : {};

      switch (filterColumn) {
        case 'status':
          return item.Compliance?.Status || '';
        case 'severity':
          return item.Severity?.Label || '';
        case 'serviceName':
          return (item.GeneratorId || '').replace(/^prowler-/, '');
        case 'region':
          return resource?.Region || '';
        case 'checkId':
          return (item.Id || '').replace(/^prowler-/, '');
        case 'checkTitle':
          return item.Title || '';
        case 'resourceId':
          return resource?.Id || '';
        case 'resourceTags':
          return resource?.Tags ? JSON.stringify(resource.Tags) : '';
        case 'statusExtended':
          return item.Description || '';
        case 'risk':
          return (item.Types || []).join(', ');
        case 'recommendation':
          return item.Remediation?.Recommendation?.Text || '';
        case 'compliance':
          return Array.isArray(item.Compliance?.RelatedRequirements)
            ? item.Compliance.RelatedRequirements.join(', ')
            : '';
        default:
          return '';
      }
    };

    const matches = (value) => {
      const v = (value || '').toString().toLowerCase();
      if (!v) return false;

      switch (filterOperator) {
        case 'equals':
          return v === search;
        case 'startsWith':
          return v.startsWith(search);
        case 'endsWith':
          return v.endsWith(search);
        case 'contains':
        default:
          return v.includes(search);
      }
    };

    return findings.filter((item) => matches(getFieldValue(item)));
  }, [findings, filterColumn, filterOperator, filterValue]);

  const pagedFindings = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredFindings.slice(start, end);
  }, [filteredFindings, page, rowsPerPage]);

  const summary = useMemo(() => {
    let passed = 0;
    let failed = 0;
    const resourceSet = new Set();

    findings.forEach((finding) => {
      const status = finding?.Compliance?.Status;
      if (status === 'PASSED') passed += 1;
      if (status === 'FAILED') failed += 1;

      if (Array.isArray(finding?.Resources)) {
        finding.Resources.forEach((res) => {
          if (res?.Id) {
            resourceSet.add(res.Id);
          }
        });
      }
    });

    return {
      totalFindings: findings.length,
      passed,
      failed,
      totalResources: resourceSet.size,
    };
  }, [findings]);

  const isWithinCooldown = useMemo(() => {
    if (isReportListLoading) return true;
    if (!reportList.length) return false;
    
    const latestReport = reportList[0];
    const timestamp = latestReport.timestamp;
    
    if (!timestamp) return false;
    
    const latestTime = new Date(timestamp).getTime();
    const now = Date.now();
    const diffMs = now - latestTime;
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    return diffMs < twentyFourHours;
  }, [reportList, isReportListLoading]);

  const showSnackbar = (type, message) => {
    setSnackbarType(type);
    setSnackbarMessage(message);
  };

  const clearSnackbar = () => {
    setSnackbarType(null);
    setSnackbarMessage('');
  };

  const handleTriggerScan = async () => {
    clearSnackbar();
    if (!userId) {
      showSnackbar('error', 'User ID not found. Please log in again.');
      return;
    }

    if (!selectedTenantId) {
      showSnackbar('error', 'Please select an Azure tenant to scan.');
      return;
    }

    try {
      setIsTriggerLoading(true);
      const res = await AzureScanApiService.triggerScan({ userId, tenantId: selectedTenantId });
      if (res?.data) {
        setIsScanAvailable(false);
        const apiMessage =
          res.data?.message ||
          'Security scan command executed successfully. Please wait some time to see the results.';
        showSnackbar('success', apiMessage);
      } else if (res?.error) {
        showSnackbar('error', res.error?.detail || res.error?.message || 'Failed to start scan.');
      }
    } catch (err) {
      showSnackbar('error', 'Something went wrong while triggering the scan.');
    } finally {
      setIsTriggerLoading(false);
    }
  };

  const loadReportList = async () => {
    clearSnackbar();
    if (!userId) return;

    try {
      setIsReportListLoading(true);
      setReportList([]);
      setSelectedOpenSearchId('');
      setRawReport(null);
      setIsScanAvailable(false);

      const res = await AzureScanApiService.getReportList();

      const list = res?.data || [];

      // Sort by timestamp desc; fallback to parsing from id suffix
      const parseTime = (item) => {
        const ts = item.timestamp;
        if (ts) {
          const d = new Date(ts);
          if (!isNaN(d.getTime())) return d.getTime();
        }
        const id = item.id || item.openSearchId || item.open_search_id || '';
        const lastUnderscore = id.lastIndexOf('_');
        if (lastUnderscore !== -1) {
          const tail = id.slice(lastUnderscore + 1);
          if (/^\d{10,}$/.test(tail)) return Number(tail);
          const iso = tail.replace(' ', 'T');
          const d2 = new Date(iso);
          if (!isNaN(d2.getTime())) return d2.getTime();
        }
        return 0;
      };

      const sorted = [...list].sort((a, b) => parseTime(b) - parseTime(a));
      setReportList(sorted);

      if (Array.isArray(sorted) && sorted.length > 0) {
        const firstId = sorted[0].id || sorted[0].openSearchId || sorted[0].open_search_id;
        if (firstId) {
          setSelectedOpenSearchId(firstId);
          await loadReport(firstId);
        }
        setIsScanAvailable(true);
      } else if (res?.isScanAvailable) {
        setIsScanAvailable(true);
      }
    } catch (err) {
      showSnackbar('error', 'Something went wrong while loading scan reports.');
      setIsScanAvailable(true);
    } finally {
      setIsReportListLoading(false);
    }
  };

  const loadReport = async (openSearchId) => {
    clearSnackbar();
    if (!openSearchId) return;

    try {
      setIsReportLoading(true);
      const res = await AzureScanApiService.getReport({ openSearchId });
      if (res?.data) {
        setRawReport(res.data);
        setPage(0);
      } else if (res?.error) {
        showSnackbar('error', res.error?.detail || res.error?.message || 'Failed to load report.');
      }
    } catch (err) {
      showSnackbar('error', 'Something went wrong while loading report.');
    } finally {
      setIsReportLoading(false);
    }
  };

  useEffect(() => {
    loadReportList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handlers matching AWS for selection and pagination
  const handleSelectChange = (event) => {
    const value = event.target.value;
    setSelectedOpenSearchId(value);
    if (value) {
      loadReport(value);
    } else {
      setRawReport(null);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChangeRowsPerPage = (event) => {
    const value = parseInt(event.target.value, 10) || 25;
    setRowsPerPage(value);
    setPage(0);
  };

  // Summary KPI cards (same visuals as AWS by reusing classes)
  const summaryCards = [
    { key: 'totalFindings', label: 'Total Findings', value: summary.totalFindings, icon: '/security-scan1-icon.svg', bg: 'card-blue' },
    { key: 'passed', label: 'Passed', value: summary.passed, icon: '/security-scan3-icon.svg', bg: 'card-green' },
    { key: 'failed', label: 'Failed', value: summary.failed, icon: '/security-scan5-icon.svg', bg: 'card-pink' },
    { key: 'totalResources', label: 'Total Resources', value: summary.totalResources, icon: '/security-scan4-icon.svg', bg: 'card-purple' },
  ];

  // Export helpers to reach feature parity
  const handleDownloadCsv = () => {
    if (!findings.length) return;

    const headers = [
      'Status',
      'Severity',
      'ServiceName',
      'Region',
      'CheckID',
      'CheckTitle',
      'ResourceId',
      'ResourceTags',
      'StatusExtended',
      'Risk',
      'Recommendation',
      'Compliance',
    ];

    const escape = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value).replace(/"/g, '""');
      return '"' + str + '"';
    };

    const rows = findings.map((item) => {
      const resource = Array.isArray(item.Resources) && item.Resources.length > 0 ? item.Resources[0] : {};
      const tags = resource?.Tags || null;
      const compliance = Array.isArray(item.Compliance?.RelatedRequirements)
        ? item.Compliance.RelatedRequirements.join(', ')
        : '';

      return [
        item.Compliance?.Status || 'N/A',
        item.Severity?.Label || 'N/A',
        (item.GeneratorId || '').replace(/^prowler-/, '') || 'N/A',
        resource?.Region || 'N/A',
        (item.Id || '').replace(/^prowler-/, '') || 'N/A',
        item.Title || 'N/A',
        resource?.Id || 'N/A',
        tags ? JSON.stringify(tags) : '',
        item.Description || 'N/A',
        (item.Types || []).join(', '),
        item.Remediation?.Recommendation?.Text || 'N/A',
        compliance || 'N/A',
      ]
        .map(escape)
        .join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `azure_scan_${selectedOpenSearchId || 'report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Grid container spacing={2} className="aws-scan-page">
      {/* ---------- Top bar ---------- */}
      <Grid size={{ xs: 12 }} className="aws-scan-topbar">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            gap: 2,
            alignItems: { xs: 'stretch', lg: 'center' },
          }}
        >
          {/* Azure Tenant Dropdown */}
          <FormControl
            size="small"
            className="azure-scan-select-control"
            disabled={tenantIdsLoading || isTriggerLoading}
            sx={{ minWidth: { xs: '100%', lg: 220 }, flex: { lg: '0 0 auto' } }}
          >
            <InputLabel id="azure-scan-tenant-select-label">Azure Tenant</InputLabel>
            <Select
              labelId="azure-scan-tenant-select-label"
              value={tenantOptions.some(opt => opt.tenantId === selectedTenantId) ? selectedTenantId : ''}
              label="Azure Tenant"
              onChange={(e) => setSelectedTenantId(e.target.value)}
            >
              {tenantIdsLoading ? (
                <MenuItem value="" disabled>
                  Loading tenants…
                </MenuItem>
              ) : tenantIds.length === 0 ? (
                <MenuItem value="" disabled>
                  No Azure tenants found
                </MenuItem>
              ) : (
                (tenantOptions.length ? tenantOptions : tenantIds.map((tenantId) => ({ tenantId, name: '' }))).map((opt) => (
                  <MenuItem key={opt.tenantId} value={opt.tenantId}>
                    {opt?.name ? `${opt.tenantId}-${opt.name}` : opt.tenantId}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          {/* Scan Button */}
          <Button
            variant="contained"
            className="scan-btn"
            onClick={handleTriggerScan}
            disabled={isTriggerLoading || isWithinCooldown || !selectedTenantId}
            sx={{ minWidth: { xs: '100%', lg: 'auto' }, flex: { lg: '0 0 auto' } }}
            endIcon={
              <img
                src="/scan-icon.svg"
                alt="Scan"
                className="scan-btn-icon"
              />
            }
          >
            {isTriggerLoading ? 'Scanning…' : isWithinCooldown ? 'Cooldown (24h)' : 'Click to Scan'}
          </Button>

          {/* Report Selection Dropdown */}
          <FormControl
            fullWidth
            size="small"
            className="aws-scan-select-control"
            sx={{ minWidth: { xs: '100%', lg: 300 }, flex: { lg: '1 1 auto' } }}
          >
            <InputLabel id="azure-scan-report-select-label">
              Select Report
            </InputLabel>
            <Select
              labelId="azure-scan-report-select-label"
              value={isReportListLoading ? '' : selectedOpenSearchId}
              label="Select Report"
              onChange={handleSelectChange}
              disabled={isReportLoading}
            >
              {isReportListLoading ? (
                <MenuItem value="" disabled>
                  Loading reports list…
                </MenuItem>
              ) : reportList.length === 0 ? (
                <MenuItem value="">No Report Available</MenuItem>
              ) : (
                reportList.map((item) => {
                  const id = item.id || item.openSearchId || item.open_search_id;
                  return (
                    <MenuItem key={id} value={id}>
                      {id}
                    </MenuItem>
                  );
                })
              )}
            </Select>
          </FormControl>

          {/* Download Button */}
          <Tooltip title="Download JSON">
            <span>
              <Button
                variant="contained"
                className="scan-download-btn"
                onClick={() => {
                  if (!rawReport) return;
                  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(findings, null, 2));
                  const dlAnchorElem = document.createElement('a');
                  dlAnchorElem.setAttribute('href', dataStr);
                  dlAnchorElem.setAttribute('download', `azure_scan_${selectedOpenSearchId || 'report'}.json`);
                  dlAnchorElem.click();
                }}
                disabled={isReportListLoading || !findings.length}
                sx={{ flex: { lg: '0 0 auto' } }}
              >
                <GetAppIcon className="scan-download-icon" />
              </Button>
            </span>
          </Tooltip>
        </Box>

        {/* Helper Text */}
        {tenantIds.length === 0 && !tenantIdsLoading && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Add Azure credentials from the Credentials page to enable scanning.
          </Typography>
        )}
      </Grid>

      {/* ---------- Summary 4 blocks ---------- */}
      {summaryCards.map((card) => (
        <Grid key={card.key} size={{ xs: 12, sm: 6, md: 3 }} className="aws-scan-summary-col">
          <div className={`aws-scan-summary-card ${card.bg}`}>
            <div className="aws-scan-summary-main">
              <div className="aws-scan-summary-icon-wrapper">
                <img src={card.icon} alt={card.label} className="aws-scan-summary-icon" />
              </div>
              <div className="aws-scan-summary-text">
                <span className="aws-scan-summary-label">{card.label}</span>
                <span className="aws-scan-summary-value">{isReportListLoading || isReportLoading ? '' : card.value}</span>
              </div>
            </div>
          </div>
        </Grid>
      ))}

      {/* Table card, actions and table */}
      <Grid size={12} className="aws-scan-table-section">
        <div className="aws-scan-table-card">
          {/* actions row */}
          <div className="aws-scan-table-actions">
            <div className="aws-scan-table-actions-right">
              <div className="aws-scan-table-action">
                <IconButton size="small" className="aws-scan-table-action-iconbtn" onClick={(e) => setColumnsAnchorEl(e.currentTarget)}>
                  <ViewColumnIcon />
                </IconButton>
                <span className="aws-scan-table-action-label aws-scan-table-action-label-clickable" style={{ cursor: 'pointer' }} onClick={(e) => setColumnsAnchorEl(e.currentTarget)}>
                  Columns
                </span>
                <Menu
                  anchorEl={columnsAnchorEl}
                  open={Boolean(columnsAnchorEl)}
                  onClose={() => setColumnsAnchorEl(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  className="aws-scan-columns-menu"
                >
                  {Object.keys(visibleColumns).map((key) => (
                    <MenuItem key={key} onClick={() => setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }))} className="aws-scan-columns-menu-item">
                      <Checkbox size="small" checked={visibleColumns[key]} />
                      <ListItemText primary={key} />
                    </MenuItem>
                  ))}
                </Menu>
              </div>

              <div className="aws-scan-table-action">
                <IconButton size="small" className="aws-scan-table-action-iconbtn" onClick={() => setIsFilterBarOpen((v) => !v)}>
                  <FilterListIcon />
                </IconButton>
                <span className="aws-scan-table-action-label aws-scan-table-action-label-clickable" style={{ cursor: 'pointer' }} onClick={() => setIsFilterBarOpen((v) => !v)}>
                  Filters
                </span>
              </div>

              <div className="aws-scan-table-action">
                <IconButton size="small" className="aws-scan-table-action-iconbtn" onClick={(e) => setDensityAnchorEl(e.currentTarget)}>
                  <DensityMediumIcon />
                </IconButton>
                <span className="aws-scan-table-action-label aws-scan-table-action-label-clickable" style={{ cursor: 'pointer' }} onClick={(e) => setDensityAnchorEl(e.currentTarget)}>
                  Density
                </span>
                <Menu
                  anchorEl={densityAnchorEl}
                  open={Boolean(densityAnchorEl)}
                  onClose={() => setDensityAnchorEl(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  className="aws-scan-density-menu"
                >
                  {['compact', 'standard', 'comfortable'].map((opt) => (
                    <MenuItem key={opt} onClick={() => setTableDensity(opt)} className="aws-scan-density-menu-item">
                      <DensityMediumIcon fontSize="small" className="aws-scan-density-menu-icon" />
                      <ListItemText primary={opt.charAt(0).toUpperCase() + opt.slice(1)} />
                    </MenuItem>
                  ))}
                </Menu>
              </div>

              <div className="aws-scan-table-action">
                <IconButton
                  size="small"
                  className="aws-scan-table-action-iconbtn"
                  onClick={(e) => setExportAnchorEl(e.currentTarget)}
                  disabled={!findings.length}
                >
                  <GetAppIcon />
                </IconButton>
                <span
                  className="aws-scan-table-action-label aws-scan-table-action-label-clickable"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => setExportAnchorEl(e.currentTarget)}
                >
                  Export
                </span>
                <Menu
                  anchorEl={exportAnchorEl}
                  open={Boolean(exportAnchorEl)}
                  onClose={() => setExportAnchorEl(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  className="aws-scan-export-menu"
                >
                  <MenuItem
                    onClick={() => {
                      handleDownloadCsv();
                      setExportAnchorEl(null);
                    }}
                    className="aws-scan-export-menu-item"
                  >
                    <ListItemText primary="Download as CSV" />
                  </MenuItem>
                  <MenuItem onClick={() => { handlePrint(); setExportAnchorEl(null); }} className="aws-scan-export-menu-item">
                    <ListItemText primary="Print" />
                  </MenuItem>
                </Menu>
              </div>
            </div>
          </div>

          {/* optional filters bar (styled like AWS) */}
          {isFilterBarOpen && (
            <div className="aws-scan-filter-bar">
              <IconButton size="small" className="aws-scan-filter-close-btn" onClick={() => setIsFilterBarOpen(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
              <div className="aws-scan-filter-main">
                <div className="aws-scan-filter-field aws-scan-filter-column">
                  <Typography variant="caption" className="aws-scan-filter-label">Columns</Typography>
                  <FormControl size="small" fullWidth>
                    <Select value={filterColumn} onChange={(e) => { setFilterColumn(e.target.value); setPage(0); }}>
                      <MenuItem value="status">Status</MenuItem>
                      <MenuItem value="severity">Severity</MenuItem>
                      <MenuItem value="serviceName">Service</MenuItem>
                      <MenuItem value="region">Region</MenuItem>
                      <MenuItem value="checkId">Check ID</MenuItem>
                      <MenuItem value="checkTitle">Title</MenuItem>
                      <MenuItem value="resourceId">Resource ID</MenuItem>
                      <MenuItem value="resourceTags">Tags</MenuItem>
                      <MenuItem value="statusExtended">Status Extended</MenuItem>
                      <MenuItem value="risk">Risk</MenuItem>
                      <MenuItem value="recommendation">Recommendation</MenuItem>
                      <MenuItem value="compliance">Compliance</MenuItem>
                    </Select>
                  </FormControl>
                </div>
                <div className="aws-scan-filter-field aws-scan-filter-operator">
                  <Typography variant="caption" className="aws-scan-filter-label">Operator</Typography>
                  <FormControl size="small" fullWidth>
                    <Select value={filterOperator} onChange={(e) => { setFilterOperator(e.target.value); setPage(0); }}>
                      <MenuItem value="contains">contains</MenuItem>
                      <MenuItem value="equals">equals</MenuItem>
                      <MenuItem value="startsWith">starts with</MenuItem>
                      <MenuItem value="endsWith">ends with</MenuItem>
                    </Select>
                  </FormControl>
                </div>
                <div className="aws-scan-filter-field aws-scan-filter-value">
                  <Typography variant="caption" className="aws-scan-filter-label aws-scan-filter-label-value">Value</Typography>
                  <TextField size="small" placeholder="Filter value" fullWidth value={filterValue} onChange={(e) => { setFilterValue(e.target.value); setPage(0); }} />
                </div>
              </div>
            </div>
          )}

          {/* table section matching AWS behaviors */}
          {isReportListLoading || isReportLoading ? (
            <div className="aws-scan-table-skeleton">
              <Skeleton variant="rectangular" height={32} className="aws-scan-table-skeleton-header" />
              <Box className="aws-scan-table-skeleton-rows">
                <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={40} />
              </Box>
            </div>
          ) : !findings.length ? (
            <div className="aws-scan-table-state">
              <Typography variant="body2">No findings available for the selected report.</Typography>
            </div>
          ) : (
            <TableContainer className="aws-scan-table-container">
              <Table stickyHeader className={`aws-scan-table aws-scan-table-density-${tableDensity}`}>
                <TableHead>
                  <TableRow>
                    {visibleColumns.status && <TableCell sx={densityCellSx}>Status</TableCell>}
                    {visibleColumns.severity && <TableCell sx={densityCellSx}>Severity</TableCell>}
                    {visibleColumns.serviceName && <TableCell sx={densityCellSx}>Service Name</TableCell>}
                    {visibleColumns.region && <TableCell sx={densityCellSx}>Region</TableCell>}
                    {visibleColumns.checkId && <TableCell sx={densityCellSx}>Check ID</TableCell>}
                    {visibleColumns.checkTitle && <TableCell sx={densityCellSx}>Check Title</TableCell>}
                    {visibleColumns.resourceId && <TableCell sx={densityCellSx}>Resource Id</TableCell>}
                    {visibleColumns.resourceTags && <TableCell sx={densityCellSx}>Resource Tags</TableCell>}
                    {visibleColumns.statusExtended && <TableCell sx={densityCellSx}>Status Extended</TableCell>}
                    {visibleColumns.risk && <TableCell sx={densityCellSx}>Risk</TableCell>}
                    {visibleColumns.recommendation && <TableCell sx={densityCellSx}>Recommendation</TableCell>}
                    {visibleColumns.compliance && <TableCell sx={densityCellSx}>Compliance</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedFindings.map((item, idx) => {
                    const resource = Array.isArray(item.Resources) && item.Resources.length > 0 ? item.Resources[0] : {};
                    const tags = resource?.Tags || null;
                    const compliance = Array.isArray(item.Compliance?.RelatedRequirements)
                      ? item.Compliance.RelatedRequirements.join(', ')
                      : '';
                    return (
                      <TableRow key={idx} className="aws-scan-table-row">
                        {visibleColumns.status && <TableCell sx={densityCellSx}>{item.Compliance?.Status || 'N/A'}</TableCell>}
                        {visibleColumns.severity && <TableCell sx={densityCellSx}>{item.Severity?.Label || 'N/A'}</TableCell>}
                        {visibleColumns.serviceName && (
                          <TableCell sx={densityCellSx}>{(item.GeneratorId || '').replace(/^prowler-/, '') || 'N/A'}</TableCell>
                        )}
                        {visibleColumns.region && <TableCell sx={densityCellSx}>{resource?.Region || 'N/A'}</TableCell>}
                        {visibleColumns.checkId && (
                          <TableCell sx={densityCellSx}>{(item.Id || '').replace(/^prowler-/, '') || 'N/A'}</TableCell>
                        )}
                        {visibleColumns.checkTitle && (
                          <TableCell sx={densityCellSx} className="aws-scan-cell-title">{item.Title || 'N/A'}</TableCell>
                        )}
                        {visibleColumns.resourceId && <TableCell sx={densityCellSx}>{resource?.Id || 'N/A'}</TableCell>}
                        {visibleColumns.resourceTags && (
                          <TableCell sx={densityCellSx} className="aws-scan-cell-tags">{tags ? JSON.stringify(tags) : 'N/A'}</TableCell>
                        )}
                        {visibleColumns.statusExtended && (
                          <TableCell sx={densityCellSx} className="aws-scan-cell-desc">{item.Description || 'N/A'}</TableCell>
                        )}
                        {visibleColumns.risk && <TableCell sx={densityCellSx}>{(item.Types || []).join(', ') || 'N/A'}</TableCell>}
                        {visibleColumns.recommendation && (
                          <TableCell sx={densityCellSx} className="aws-scan-cell-rec">{item.Remediation?.Recommendation?.Text || 'N/A'}</TableCell>
                        )}
                        {visibleColumns.compliance && (
                          <TableCell sx={densityCellSx} className="aws-scan-cell-comp">{compliance || 'N/A'}</TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* pagination */}
          {findings.length > 0 && (
            <div className="aws-scan-pagination-row">
              <TablePagination
                component="div"
                count={filteredFindings.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[25, 50, 100]}
              />
            </div>
          )}
        </div>
      </Grid>

      {snackbarType && (
        <Grid size={12} className="aws-scan-snackbar-row">
          <SnackbarNotification
            initialOpen
            duration={5000}
            message={snackbarMessage}
            actionButtonName="Ok"
            theme={snackbarType === 'success' ? SNACKBAR_THEME.GREEN : SNACKBAR_THEME.RED}
            yPosition="top"
            xPosition="center"
          />
        </Grid>
      )}
    </Grid>
  );
};

export default AzureScan;
