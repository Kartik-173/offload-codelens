import React from "react";
import OverviewCards from "./OverviewCards";
import SeverityBreakdown from "./SeverityBreakdown";
import CWESummary from "./CWESummary";
import LanguageSummary from "./LanguageSummary";
import ScanMetadata from "./ScanMetadata";

const Box = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const OpenGrepOverviewTab = ({ details }) => {
  if (!details) return null;

  const summary = details.summary || {};
  const scanMetadata = details.scan_metadata || null;
  const severityCount = summary.severity_count || {};

  return (
    <Box className="space-y-4">
      <Box className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-cyan-50 p-4">
        <h3 className="text-sm font-semibold text-slate-900">OpenGrep Security Overview</h3>
        <p className="mt-1 text-xs text-slate-600">
          Review findings distribution, top CWEs, language exposure, and scan metadata.
        </p>
        <Box className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700">
            Total: <strong className="ml-1">{summary.total_findings ?? 0}</strong>
          </span>
          <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-700">
            Critical: <strong className="ml-1">{severityCount.CRITICAL ?? 0}</strong>
          </span>
          <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs text-orange-700">
            High: <strong className="ml-1">{severityCount.HIGH ?? 0}</strong>
          </span>
        </Box>
      </Box>

      <OverviewCards summary={summary} />

      <Box className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SeverityBreakdown severity={summary.severity_count || {}} />
        <CWESummary cwe={summary.cwe || {}} />
      </Box>

      <Box className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LanguageSummary languages={summary.languages || {}} />
        <ScanMetadata metadata={scanMetadata} />
      </Box>
    </Box>
  );
};

export default OpenGrepOverviewTab;
