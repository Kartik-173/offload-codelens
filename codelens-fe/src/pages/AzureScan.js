import React, { useEffect, useMemo, useState } from 'react';
import AzureScanApiService from '../services/AzureScanApiService';
import CredentialsApiService from '../services/CredentialsApiService';
import { useToast } from '../components/common/ToastProvider';
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Columns,
  Filter,
  Menu as MenuIcon,
  Download,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

const AzureScan = () => {
  const { success, error } = useToast();
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
        error('Failed to load Azure tenant IDs. Please add Azure credentials first.');
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
    if (type === 'success') {
      success(message);
    } else {
      error(message);
    }
  };

  const clearSnackbar = () => {};

  const handleTriggerScan = async () => {
    if (!userId) {
      error('User ID not found. Please log in again.');
      return;
    }

    if (!selectedTenantId) {
      error('Please select an Azure tenant to scan.');
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
        success(apiMessage);
      } else if (res?.error) {
        error(res.error?.detail || res.error?.message || 'Failed to start scan.');
      }
    } catch (err) {
      error('Something went wrong while triggering the scan.');
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
      error('Something went wrong while loading scan reports.');
      setIsScanAvailable(true);
    } finally {
      setIsReportListLoading(false);
    }
  };

  const loadReport = async (openSearchId) => {
    if (!openSearchId) return;

    try {
      setIsReportLoading(true);
      const res = await AzureScanApiService.getReport({ openSearchId });
      if (res?.data) {
        setRawReport(res.data);
        setPage(0);
      } else if (res?.error) {
        error(res.error?.detail || res.error?.message || 'Failed to load report.');
      }
    } catch (err) {
      error('Something went wrong while loading report.');
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
    <div className="aws-scan-page p-4">
      {/* ---------- Top bar ---------- */}
      <div className="aws-scan-topbar mb-4">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          {/* Azure Tenant Dropdown */}
          <div className="azure-scan-select-control">
            <label className="block text-sm font-medium mb-1">Azure Tenant</label>
            <select
              className="w-full lg:w-56 p-2 border rounded"
              value={tenantOptions.some(opt => opt.tenantId === selectedTenantId) ? selectedTenantId : ''}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              disabled={tenantIdsLoading || isTriggerLoading}
            >
              {tenantIdsLoading ? (
                <option value="" disabled>Loading tenants…</option>
              ) : tenantIds.length === 0 ? (
                <option value="" disabled>No Azure tenants found</option>
              ) : (
                (tenantOptions.length ? tenantOptions : tenantIds.map((tenantId) => ({ tenantId, name: '' }))).map((opt) => (
                  <option key={opt.tenantId} value={opt.tenantId}>
                    {opt?.name ? `${opt.tenantId}-${opt.name}` : opt.tenantId}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Scan Button */}
          <button
            className="scan-btn bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            onClick={handleTriggerScan}
            disabled={isTriggerLoading || isWithinCooldown || !selectedTenantId}
          >
            {isTriggerLoading ? 'Scanning…' : isWithinCooldown ? 'Cooldown (24h)' : 'Click to Scan'}
            <img src="/scan-icon.svg" alt="Scan" className="inline-block ml-2 h-4 w-4" />
          </button>

          {/* Report Selection Dropdown */}
          <div className="aws-scan-select-control flex-1">
            <label className="block text-sm font-medium mb-1">Select Report</label>
            <select
              className="w-full lg:w-72 p-2 border rounded"
              value={isReportListLoading ? '' : selectedOpenSearchId}
              onChange={handleSelectChange}
              disabled={isReportLoading}
            >
              {isReportListLoading ? (
                <option value="" disabled>Loading reports list…</option>
              ) : reportList.length === 0 ? (
                <option value="">No Report Available</option>
              ) : (
                reportList.map((item) => {
                  const id = item.id || item.openSearchId || item.open_search_id;
                  return (
                    <option key={id} value={id}>{id}</option>
                  );
                })
              )}
            </select>
          </div>

          {/* Download Button */}
          <button
            className="scan-download-btn bg-slate-600 text-white p-2 rounded hover:bg-slate-700 disabled:opacity-50"
            title="Download JSON"
            onClick={() => {
              if (!rawReport) return;
              const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(findings, null, 2));
              const dlAnchorElem = document.createElement('a');
              dlAnchorElem.setAttribute('href', dataStr);
              dlAnchorElem.setAttribute('download', `azure_scan_${selectedOpenSearchId || 'report'}.json`);
              dlAnchorElem.click();
            }}
            disabled={isReportListLoading || !findings.length}
          >
            <Download className="h-5 w-5" />
          </button>
        </div>

        <div className="aws-scan-table-actions mt-4">
          <div className="aws-scan-table-action">
            <button
              className="p-2 hover:bg-slate-100 rounded"
              onClick={(e) => setExportAnchorEl(e.currentTarget)}
              disabled={!findings.length}
            >
              <Download className="h-5 w-5" />
            </button>
            <span
              className="cursor-pointer"
              onClick={(e) => setExportAnchorEl(e.currentTarget)}
            >
              Export
            </span>
            {exportAnchorEl && (
              <div className="absolute bg-white shadow-lg rounded border mt-1 py-1 z-50">
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-slate-100"
                  onClick={() => { handleDownloadCsv(); setExportAnchorEl(null); }}
                >
                  Download as CSV
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-slate-100"
                  onClick={() => { handlePrint(); setExportAnchorEl(null); }}
                >
                  Print
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AzureScan;
