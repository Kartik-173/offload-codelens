import React from "react";

/**
 * @param {number} value - selected tab index
 * @param {function} onChange - setter
 * @param {Array<{ label: string }>} tabs - dynamic tab config
 */
const ReportTabs = ({ value, onChange, tabs }) => {
  return (
    <div className="report-tabs-wrapper overflow-x-auto">
      <div className="inline-flex min-w-full border-b">
        {tabs.map((tab, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onChange(index)}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              value === index
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ReportTabs;
