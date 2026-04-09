import React from "react";
import { formatReportName } from "../../utils/Helpers";
import { ChevronDown, FolderOpen } from "lucide-react";

const ReportSelector = ({ reports, selected, onChange, loading }) => {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <FolderOpen className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <label htmlFor="report-select" className="mb-1 block text-sm font-medium text-slate-700">
            Select Report
          </label>
          <div className="relative">
            <select
              id="report-select"
              value={selected}
              disabled={loading}
              className="h-10 w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 pr-10 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(e) => onChange(e.target.value)}
            >
              {loading ? (
                <option value="">Loading reports...</option>
              ) : reports.length === 0 ? (
                <option value="">No reports available</option>
              ) : (
                reports.map((item, idx) => (
                  <option key={idx} value={item.Key}>
                    {formatReportName(item.projectKey)}
                  </option>
                ))
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportSelector;
