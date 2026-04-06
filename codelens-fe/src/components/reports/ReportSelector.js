import React from "react";
import { formatReportName } from "../../utils/Helpers";

const ReportSelector = ({ reports, selected, onChange }) => {
  return (
    <div className="repo-select-grid">
      <div className="dropdown-half">
        <div className="select-control w-full">
          <label htmlFor="report-select" className="mb-1 block text-sm font-medium">
            Select
          </label>
          <select
            id="report-select"
            value={selected}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            onChange={(e) => onChange(e.target.value)}
          >
            {reports.map((item, idx) => (
              <option key={idx} value={item.Key}>
                {formatReportName(item.projectKey)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ReportSelector;
