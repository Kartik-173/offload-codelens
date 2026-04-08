import React from "react";
import { Bug, Shield, Wrench } from "lucide-react";

const IssuesSeverityChart = ({ data, onIssueCountClick }) => {
  const issueTypes = [
    { key: "BUG", label: "Bugs", icon: <Bug className="h-4 w-4" />, color: "text-red-500" },
    { key: "VULNERABILITY", label: "Vulnerabilities", icon: <Shield className="h-4 w-4" />, color: "text-orange-500" },
    { key: "CODE_SMELL", label: "Code Smells", icon: <Wrench className="h-4 w-4" />, color: "text-blue-500" },
  ];

  const severities = [
    { key: "BLOCKER", label: "Blocker", color: "bg-red-600", textColor: "text-red-600" },
    { key: "CRITICAL", label: "Critical", color: "bg-red-500", textColor: "text-red-500" },
    { key: "MAJOR", label: "Major", color: "bg-orange-500", textColor: "text-orange-500" },
    { key: "MINOR", label: "Minor", color: "bg-blue-500", textColor: "text-blue-500" },
    { key: "INFO", label: "Info", textColor: "text-slate-400" },
  ];

  const getCount = (severityKey, typeIndex) => {
    if (!data || !data[severityKey]) return 0;
    return data[severityKey][typeIndex] || 0;
  };

  return (
    <div className="severity-chart">
      {/* Header with better layout - stacked icon/text to prevent overlap */}
      <div className="flex border-b border-slate-200 pb-3 mb-3">
        <div className="w-20 flex-shrink-0 text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-end">Severity</div>
        <div className="flex-1 flex">
          {issueTypes.map((type) => (
            <div key={type.key} className="flex-1 text-center">
              <div className={`flex flex-col items-center gap-0.5 ${type.color}`}>
                {type.icon}
                <span className="text-[10px] font-medium leading-tight">{type.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table Rows with flex */}
      <div className="space-y-1">
        {severities.map((sev) => (
          <div key={sev.key} className="flex items-center py-1.5 px-1 hover:bg-slate-50 rounded transition-colors">
            {/* Severity Label */}
            <div className="w-20 flex-shrink-0 flex items-center gap-2">
              <span className={`inline-block h-2 w-2 rounded-full ${sev.color || "bg-slate-400"}`}></span>
              <span className={`text-sm font-medium ${sev.textColor || "text-slate-600"}`}>
                {sev.label}
              </span>
            </div>

            {/* Counts for each issue type */}
            <div className="flex-1 flex">
              {issueTypes.map((type, idx) => {
                const count = getCount(sev.key, idx);
                return (
                  <div key={type.key} className="flex-1 text-center">
                    <button
                      onClick={() => onIssueCountClick && onIssueCountClick(type.key, sev.key)}
                      className={`text-sm font-semibold transition-colors px-2 py-0.5 rounded ${
                        count > 0
                          ? "text-slate-900 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                          : "text-slate-300"
                      }`}
                      disabled={count === 0}
                    >
                      {count.toLocaleString()}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-2 border-t border-slate-200">
        <div className="flex flex-wrap gap-3">
          {severities.map((sev) => (
            <div key={sev.key} className="flex items-center gap-1.5">
              <span className={`inline-block h-2 w-2 rounded-full ${sev.color || "bg-slate-400"}`}></span>
              <span className="text-xs text-slate-600">{sev.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IssuesSeverityChart;
