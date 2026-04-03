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
import AWSScanApiService from '../services/AWSScanApiService';
import CredentialsApiService from '../services/CredentialsApiService';
import SnackbarNotification, {
  SNACKBAR_THEME,
} from '../components/common/SnackbarNotification';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import FilterListIcon from '@mui/icons-material/FilterList';
import DensityMediumIcon from '@mui/icons-material/DensityMedium';
import GetAppIcon from '@mui/icons-material/GetApp';
import Grid from '@mui/material/Grid';
import CloseIcon from '@mui/icons-material/Close';

const AwsScan = () => {
  const [isTriggerLoading, setIsTriggerLoading] = useState(false);
  const [isReportListLoading, setIsReportListLoading] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);

  const [accountIdsLoading, setAccountIdsLoading] = useState(false);
  const [accountIds, setAccountIds] = useState([]);
  const [accountOptions, setAccountOptions] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');

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
    const loadAccountIds = async () => {
      if (!userId) {
        setAccountIds([]);
        setAccountOptions([]);
        setSelectedAccountId('');
        return;
      }

      try {
        setAccountIdsLoading(true);
        const res = await CredentialsApiService.listAccountIds(userId);

        const payload = res?.data?.data || res?.data || {};
        const ids = payload.accountIds || [];
        const accounts = Array.isArray(payload.accounts) ? payload.accounts : null;

        const normalized = ids.map((id) => String(id));
        const normalizedOptions = accounts
          ? accounts
              .map((a) => ({
                accountId: String(a?.accountId ?? a?.id ?? ''),
                name: a?.name || '',
              }))
              .filter((a) => a.accountId)
          : normalized.map((accountId) => ({ accountId, name: '' }));

        setAccountIds(normalized);
        setAccountOptions(normalizedOptions);
        setSelectedAccountId((prev) => {
          if (prev && normalized.includes(prev)) return prev;
          return normalized[0] || '';
        });
      } catch (err) {
        setAccountIds([]);
        setAccountOptions([]);
        setSelectedAccountId('');
        showSnackbar('error', 'Failed to load AWS account IDs. Please add AWS credentials first.');
      } finally {
        setAccountIdsLoading(false);
      }
    };

    loadAccountIds();
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
      const resource =
        Array.isArray(item.Resources) && item.Resources.length > 0
          ? item.Resources[0]
          : {};

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

    if (!selectedAccountId) {
      showSnackbar('error', 'Please select an AWS account to scan.');
      return;
    }

    try {
      setIsTriggerLoading(true);
      const res = await AWSScanApiService.triggerScan({ userId, accountId: selectedAccountId });
      if (res?.data) {
        setIsScanAvailable(false);
        const apiMessage =
          res.data?.message ||
          'Security scan command executed successfully. Please wait some time to see the results.';
        showSnackbar('success', apiMessage);
      } else if (res?.error) {
        showSnackbar(
          'error',
          res.error?.detail || res.error?.message || 'Failed to start scan.'
        );
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

      const res = await AWSScanApiService.getReportList();

      const list = res?.data || [];

      // Sort by timestamp desc; fall back to parsing from id suffix
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
          // epoch millis fallback
          if (/^\d{10,}$/.test(tail)) return Number(tail);
          // formatted "YYYY-MM-DD HH:MM:SS"
          const iso = tail.replace(' ', 'T');
          const d2 = new Date(iso);
          if (!isNaN(d2.getTime())) return d2.getTime();
        }
        return 0;
      };

      const sorted = [...list].sort((a, b) => parseTime(b) - parseTime(a));
      setReportList(sorted);

      if (Array.isArray(sorted) && sorted.length > 0) {
        const firstId =
          sorted[0].id || sorted[0].openSearchId || sorted[0].open_search_id;
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
      const res = await AWSScanApiService.getReport({ openSearchId });
      if (res?.data) {
        setRawReport(res.data);
        setPage(0);
      } else if (res?.error) {
        showSnackbar(
          'error',
          res.error?.detail || res.error?.message || 'Failed to load report.'
        );
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

  const handleSelectChange = (event) => {
    const value = event.target.value;
    setSelectedOpenSearchId(value);
    if (value) {
      loadReport(value);
    } else {
      setRawReport(null);
    }
  };

  const summaryCards = [
    {
      key: 'totalFindings',
      label: 'Total Findings',
      value: summary.totalFindings,
      icon: '/security-scan1-icon.svg',
      bg: 'card-blue',
    },
    {
      key: 'passed',
      label: 'Passed',
      value: summary.passed,
      icon: '/security-scan3-icon.svg',
      bg: 'card-green',
    },
    {
      key: 'failed',
      label: 'Failed',
      value: summary.failed,
      icon: '/security-scan5-icon.svg',
      bg: 'card-pink',
    },
    {
      key: 'totalResources',
      label: 'Total Resources',
      value: summary.totalResources,
      icon: '/security-scan4-icon.svg',
      bg: 'card-purple',
    },
  ];

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChangeRowsPerPage = (event) => {
    const value = parseInt(event.target.value, 10) || 25;
    setRowsPerPage(value);
    setPage(0);
  };

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
      return `"${str}` + '"';
    };

    const rows = findings.map((item) => {
      const resource =
        Array.isArray(item.Resources) && item.Resources.length > 0
          ? item.Resources[0]
          : {};
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

    const csvContent = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileId = selectedOpenSearchId || 'aws_security_scan';
    link.download = `${fileId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const allColumns = [
    { key: 'status', label: 'Status' },
    { key: 'severity', label: 'Severity' },
    { key: 'serviceName', label: 'Service Name' },
    { key: 'region', label: 'Region' },
    { key: 'checkId', label: 'Check ID' },
    { key: 'checkTitle', label: 'Check Title' },
    { key: 'resourceId', label: 'Resource Id' },
    { key: 'resourceTags', label: 'Resource Tags' },
    { key: 'statusExtended', label: 'Status Extended' },
    { key: 'risk', label: 'Risk' },
    { key: 'recommendation', label: 'Recommendation' },
    { key: 'compliance', label: 'Compliance' },
  ];

  const handleOpenColumnsMenu = (event) => {
    setColumnsAnchorEl(event.currentTarget);
  };

  const handleCloseColumnsMenu = () => {
    setColumnsAnchorEl(null);
    setColumnSearch('');
  };

  const handleToggleColumn = (key) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleShowHideAllColumns = () => {
    const allVisible = allColumns.every((col) => visibleColumns[col.key]);
    const next = {};
    allColumns.forEach((col) => {
      next[col.key] = !allVisible;
    });
    setVisibleColumns(next);
  };

  const handleResetColumns = () => {
    const next = {};
    allColumns.forEach((col) => {
      next[col.key] = true;
    });
    setVisibleColumns(next);
  };

  const filteredColumns = allColumns.filter((col) =>
    col.label.toLowerCase().includes(columnSearch.toLowerCase())
  );

  const handleToggleFiltersBar = () => {
    setIsFilterBarOpen((prev) => !prev);
  };

  const handleClearFilter = () => {
    setFilterValue('');
    setIsFilterBarOpen(false);
    setPage(0);
  };

  const handleOpenDensityMenu = (event) => {
    setDensityAnchorEl(event.currentTarget);
  };

  const handleCloseDensityMenu = () => {
    setDensityAnchorEl(null);
  };

  const handleChangeDensity = (value) => {
    setTableDensity(value);
    setDensityAnchorEl(null);
  };

  const handleOpenExportMenu = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleCloseExportMenu = () => {
    setExportAnchorEl(null);
  };

  const handlePrint = () => {
    handleCloseExportMenu();
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
          {/* AWS Account Dropdown */}
          <FormControl
            size="small"
            className="aws-scan-select-control"
            disabled={accountIdsLoading || isTriggerLoading}
            sx={{ minWidth: { xs: '100%', lg: 220 }, flex: { lg: '0 0 auto' } }}
          >
            <InputLabel id="aws-scan-account-select-label">AWS Account</InputLabel>
            <Select
              labelId="aws-scan-account-select-label"
              value={accountOptions.some(opt => opt.accountId === selectedAccountId) ? selectedAccountId : ''}
              label="AWS Account"
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              {accountIdsLoading ? (
                <MenuItem value="" disabled>
                  Loading accounts…
                </MenuItem>
              ) : accountIds.length === 0 ? (
                <MenuItem value="" disabled>
                  No AWS accounts found
                </MenuItem>
              ) : (
                (accountOptions.length ? accountOptions : accountIds.map((accountId) => ({ accountId, name: '' }))).map((opt) => (
                  <MenuItem key={opt.accountId} value={opt.accountId}>
                    {opt?.name ? `${opt.accountId}-${opt.name}` : opt.accountId}
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
            disabled={isTriggerLoading || isWithinCooldown || !selectedAccountId}
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
            <InputLabel id="aws-scan-report-select-label">
              Select Report
            </InputLabel>
            <Select
              labelId="aws-scan-report-select-label"
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
          <Tooltip title="Download CSV">
            <span>
              <Button
                variant="contained"
                className="scan-download-btn"
                onClick={handleDownloadCsv}
                disabled={isReportListLoading || !findings.length}
                sx={{ flex: { lg: '0 0 auto' } }}
              >
                <GetAppIcon className="scan-download-icon" />
              </Button>
            </span>
          </Tooltip>
        </Box>

        {/* Helper Text */}
        {accountIds.length === 0 && !accountIdsLoading && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Add AWS credentials from the Credentials page to enable scanning.
          </Typography>
        )}
      </Grid>

      {/* ---------- Summary 4 blocks ---------- */}
      {summaryCards.map((card) => (
        <Grid
          key={card.key}
          size={{ xs: 12, sm: 6, md: 3 }}
          className="aws-scan-summary-col"
        >
          <div className={`aws-scan-summary-card ${card.bg}`}>
            <div className="aws-scan-summary-main">
              <div className="aws-scan-summary-icon-wrapper">
                <img
                  src={card.icon}
                  alt={card.label}
                  className="aws-scan-summary-icon"
                />
              </div>

              <div className="aws-scan-summary-text">
                <span className="aws-scan-summary-label">
                  {card.label}
                </span>
                <span className="aws-scan-summary-value">
                  {isReportListLoading || isReportLoading ? '' : card.value}
                </span>
              </div>
            </div>
          </div>
        </Grid>
      ))}

      {/* ---------- Table card ---------- */}
      <Grid size={12} className="aws-scan-table-section">
        <div className="aws-scan-table-card">
          {/* table actions */}
          <div className="aws-scan-table-actions">
            <div className="aws-scan-table-actions-right">
              <div className="aws-scan-table-action">
                <IconButton
                  size="small"
                  className="aws-scan-table-action-iconbtn"
                  onClick={handleOpenColumnsMenu}
                >
                  <ViewColumnIcon />
                </IconButton>
                <span
                  className="aws-scan-table-action-label aws-scan-table-action-label-clickable"
                  style={{ cursor: 'pointer' }}
                  onClick={handleOpenColumnsMenu}
                >
                  Columns
                </span>
                <Menu
                  anchorEl={columnsAnchorEl}
                  open={Boolean(columnsAnchorEl)}
                  onClose={handleCloseColumnsMenu}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  className="aws-scan-columns-menu"
                >
                  <Box sx={{ px: 2, pt: 1, pb: 1 }} className="aws-scan-columns-search-wrapper">
                    <TextField
                      size="small"
                      placeholder="Search"
                      fullWidth
                      value={columnSearch}
                      onChange={(e) => setColumnSearch(e.target.value)}
                    />
                  </Box>
                  <Divider />
                  {filteredColumns.map((col) => (
                    <MenuItem
                      key={col.key}
                      onClick={() => handleToggleColumn(col.key)}
                      className="aws-scan-columns-menu-item"
                    >
                      <Checkbox
                        size="small"
                        checked={Boolean(visibleColumns[col.key])}
                      />
                      <ListItemText primary={col.label} />
                    </MenuItem>
                  ))}
                  <Divider />
                  <MenuItem onClick={handleShowHideAllColumns} className="aws-scan-columns-menu-item-all">
                    <Checkbox
                      size="small"
                      indeterminate={
                        Object.values(visibleColumns).some(Boolean) &&
                        !allColumns.every((col) => visibleColumns[col.key])
                      }
                      checked={allColumns.every((col) => visibleColumns[col.key])}
                    />
                    <ListItemText primary="Show/Hide All" />
                  </MenuItem>
                  <MenuItem onClick={handleResetColumns} className="aws-scan-columns-menu-item-reset">
                    <ListItemText primary="Reset" />
                  </MenuItem>
                </Menu>
              </div>
              <div className="aws-scan-table-action">
                <IconButton
                  size="small"
                  className="aws-scan-table-action-iconbtn"
                  onClick={handleToggleFiltersBar}
                >
                  <FilterListIcon />
                </IconButton>
                <span
                  className="aws-scan-table-action-label aws-scan-table-action-label-clickable"
                  style={{ cursor: 'pointer' }}
                  onClick={handleToggleFiltersBar}
                >
                  Filters
                </span>
              </div>
              <div className="aws-scan-table-action">
                <IconButton
                  size="small"
                  className="aws-scan-table-action-iconbtn"
                  onClick={handleOpenDensityMenu}
                >
                  <DensityMediumIcon />
                </IconButton>
                <span
                  className="aws-scan-table-action-label aws-scan-table-action-label-clickable"
                  style={{ cursor: 'pointer' }}
                  onClick={handleOpenDensityMenu}
                >
                  Density
                </span>
                <Menu
                  anchorEl={densityAnchorEl}
                  open={Boolean(densityAnchorEl)}
                  onClose={handleCloseDensityMenu}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  className="aws-scan-density-menu"
                >
                  <MenuItem
                    selected={tableDensity === 'compact'}
                    onClick={() => handleChangeDensity('compact')}
                    className="aws-scan-density-menu-item"
                  >
                    <DensityMediumIcon fontSize="small" className="aws-scan-density-menu-icon" />
                    <ListItemText primary="Compact" />
                  </MenuItem>
                  <MenuItem
                    selected={tableDensity === 'standard'}
                    onClick={() => handleChangeDensity('standard')}
                    className="aws-scan-density-menu-item"
                  >
                    <DensityMediumIcon fontSize="small" className="aws-scan-density-menu-icon" />
                    <ListItemText primary="Standard" />
                  </MenuItem>
                  <MenuItem
                    selected={tableDensity === 'comfortable'}
                    onClick={() => handleChangeDensity('comfortable')}
                    className="aws-scan-density-menu-item"
                  >
                    <DensityMediumIcon fontSize="small" className="aws-scan-density-menu-icon" />
                    <ListItemText primary="Comfortable" />
                  </MenuItem>
                </Menu>
              </div>
              <div className="aws-scan-table-action">
                <IconButton
                  size="small"
                  className="aws-scan-table-action-iconbtn"
                  onClick={handleOpenExportMenu}
                  disabled={!findings.length}
                >
                  <GetAppIcon />
                </IconButton>
                <span
                  className="aws-scan-table-action-label aws-scan-table-action-label-clickable"
                  style={{ cursor: 'pointer' }}
                  onClick={handleOpenExportMenu}
                >
                  Export
                </span>
                <Menu
                  anchorEl={exportAnchorEl}
                  open={Boolean(exportAnchorEl)}
                  onClose={handleCloseExportMenu}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  className="aws-scan-export-menu"
                >
                  <MenuItem
                    onClick={() => {
                      handleDownloadCsv();
                      handleCloseExportMenu();
                    }}
                    className="aws-scan-export-menu-item"
                  >
                    <ListItemText primary="Download as CSV" />
                  </MenuItem>
                  <MenuItem
                    onClick={handlePrint}
                    className="aws-scan-export-menu-item"
                  >
                    <ListItemText primary="Print" />
                  </MenuItem>
                </Menu>
              </div>
            </div>
          </div>

          {/* table content */}
          {isFilterBarOpen && (
            <div className="aws-scan-filter-bar">
              <IconButton
                size="small"
                className="aws-scan-filter-close-btn"
                onClick={handleClearFilter}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
              <div className="aws-scan-filter-main">
                <div className="aws-scan-filter-field aws-scan-filter-column">
                  <Typography variant="caption" className="aws-scan-filter-label">
                    Columns
                  </Typography>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={filterColumn}
                      onChange={(e) => {
                        setFilterColumn(e.target.value);
                        setPage(0);
                      }}
                    >
                      {allColumns.map((col) => (
                        <MenuItem key={col.key} value={col.key}>
                          {col.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                <div className="aws-scan-filter-field aws-scan-filter-operator">
                  <Typography variant="caption" className="aws-scan-filter-label">
                    Operator
                  </Typography>
                  <FormControl size="small" fullWidth>
                    <Select
                      value={filterOperator}
                      onChange={(e) => {
                        setFilterOperator(e.target.value);
                        setPage(0);
                      }}
                    >
                      <MenuItem value="contains">contains</MenuItem>
                      <MenuItem value="equals">equals</MenuItem>
                      <MenuItem value="startsWith">starts with</MenuItem>
                      <MenuItem value="endsWith">ends with</MenuItem>
                    </Select>
                  </FormControl>
                </div>

                <div className="aws-scan-filter-field aws-scan-filter-value">
                  <Typography
                    variant="caption"
                    className="aws-scan-filter-label aws-scan-filter-label-value"
                  >
                    Value
                  </Typography>
                  <TextField
                    size="small"
                    placeholder="Filter value"
                    fullWidth
                    value={filterValue}
                    onChange={(e) => {
                      setFilterValue(e.target.value);
                      setPage(0);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {isReportListLoading || isReportLoading ? (
            <div className="aws-scan-table-skeleton">
              <Skeleton
                variant="rectangular"
                height={32}
                className="aws-scan-table-skeleton-header"
              />
              <Box className="aws-scan-table-skeleton-rows">
                <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={40} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={40} />
              </Box>
            </div>
          ) : !findings.length ? (
            <div className="aws-scan-table-state">
              <Typography variant="body2">
                No findings available for the selected report.
              </Typography>
            </div>
          ) : (
            <TableContainer className="aws-scan-table-container">
              <Table
                stickyHeader
                className={`aws-scan-table aws-scan-table-density-${tableDensity}`}
              >
                <TableHead>
                  <TableRow>
                    {visibleColumns.status && (
                      <TableCell sx={densityCellSx}>Status</TableCell>
                    )}
                    {visibleColumns.severity && (
                      <TableCell sx={densityCellSx}>Severity</TableCell>
                    )}
                    {visibleColumns.serviceName && (
                      <TableCell sx={densityCellSx}>Service Name</TableCell>
                    )}
                    {visibleColumns.region && (
                      <TableCell sx={densityCellSx}>Region</TableCell>
                    )}
                    {visibleColumns.checkId && (
                      <TableCell sx={densityCellSx}>Check ID</TableCell>
                    )}
                    {visibleColumns.checkTitle && (
                      <TableCell sx={densityCellSx}>Check Title</TableCell>
                    )}
                    {visibleColumns.resourceId && (
                      <TableCell sx={densityCellSx}>Resource Id</TableCell>
                    )}
                    {visibleColumns.resourceTags && (
                      <TableCell sx={densityCellSx}>Resource Tags</TableCell>
                    )}
                    {visibleColumns.statusExtended && (
                      <TableCell sx={densityCellSx}>Status Extended</TableCell>
                    )}
                    {visibleColumns.risk && (
                      <TableCell sx={densityCellSx}>Risk</TableCell>
                    )}
                    {visibleColumns.recommendation && (
                      <TableCell sx={densityCellSx}>Recommendation</TableCell>
                    )}
                    {visibleColumns.compliance && (
                      <TableCell sx={densityCellSx}>Compliance</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedFindings.map((item, index) => {
                    const resource =
                      Array.isArray(item.Resources) &&
                      item.Resources.length > 0
                        ? item.Resources[0]
                        : {};
                    const tags = resource?.Tags || null;
                    const compliance = Array.isArray(
                      item.Compliance?.RelatedRequirements
                    )
                      ? item.Compliance.RelatedRequirements.join(', ')
                      : '';

                    return (
                      <TableRow key={index} className="aws-scan-table-row">
                        {visibleColumns.status && (
                          <TableCell sx={densityCellSx}>
                            {item.Compliance?.Status || 'N/A'}
                          </TableCell>
                        )}
                        {visibleColumns.severity && (
                          <TableCell sx={densityCellSx}>
                            {item.Severity?.Label || 'N/A'}
                          </TableCell>
                        )}
                        {visibleColumns.serviceName && (
                          <TableCell sx={densityCellSx}>
                            {(item.GeneratorId || '').replace(
                              /^prowler-/,
                              ''
                            ) || 'N/A'}
                          </TableCell>
                        )}
                        {visibleColumns.region && (
                          <TableCell sx={densityCellSx}>
                            {resource?.Region || 'N/A'}
                          </TableCell>
                        )}
                        {visibleColumns.checkId && (
                          <TableCell sx={densityCellSx}>
                            {(item.Id || '').replace(/^prowler-/, '') ||
                              'N/A'}
                          </TableCell>
                        )}
                        {visibleColumns.checkTitle && (
                          <TableCell
                            sx={densityCellSx}
                            className="aws-scan-cell-title"
                          >
                            {item.Title || 'N/A'}
                          </TableCell>
                        )}
                        {visibleColumns.resourceId && (
                          <TableCell sx={densityCellSx}>
                            {resource?.Id || 'N/A'}
                          </TableCell>
                        )}
                        {visibleColumns.resourceTags && (
                          <TableCell
                            sx={densityCellSx}
                            className="aws-scan-cell-tags"
                          >
                            {tags ? JSON.stringify(tags) : 'N/A'}
                          </TableCell>
                        )}
                        {visibleColumns.statusExtended && (
                          <TableCell
                            sx={densityCellSx}
                            className="aws-scan-cell-desc"
                          >
                            {item.Description || 'N/A'}
                          </TableCell>
                        )}
                        {visibleColumns.risk && (
                          <TableCell sx={densityCellSx}>
                            {(item.Types || []).join(', ') || 'N/A'}
                          </TableCell>
                        )}
                        {visibleColumns.recommendation && (
                          <TableCell
                            sx={densityCellSx}
                            className="aws-scan-cell-rec"
                          >
                            {item.Remediation?.Recommendation?.Text ||
                              'N/A'}
                          </TableCell>
                        )}
                        {visibleColumns.compliance && (
                          <TableCell
                            sx={densityCellSx}
                            className="aws-scan-cell-comp"
                          >
                            {compliance || 'N/A'}
                          </TableCell>
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
            theme={
              snackbarType === 'success'
                ? SNACKBAR_THEME.GREEN
                : SNACKBAR_THEME.RED
            }
            yPosition="top"
            xPosition="center"
          />
        </Grid>
      )}
    </Grid>
  );
};

export default AwsScan;
