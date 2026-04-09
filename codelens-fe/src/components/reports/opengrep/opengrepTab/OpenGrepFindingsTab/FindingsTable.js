import React from "react";

const Box = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const Chip = ({ label, className = "" }) => (
  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${className}`.trim()}>
    {label}
  </span>
);

const Tooltip = ({ children, title }) => (
  <span title={typeof title === "string" ? title : undefined}>{children}</span>
);

const Typography = ({ children, className = "" }) => (
  <span className={className}>{children}</span>
);

const SEVERITY_CLASS = {
  CRITICAL: "border-rose-200 bg-rose-50 text-rose-700",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const SeverityChip = ({ severity }) => (
  <Chip
    label={severity}
    className={SEVERITY_CLASS[severity?.toUpperCase?.()] || "border-slate-200 bg-slate-50 text-slate-700"}
  />
);

const FindingsTable = ({ rows, onRowClick }) => {
  return (
    <Box className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {rows.length === 0 ? (
        <div className="p-6 text-sm text-slate-500">No findings detected 🎉</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-3 font-semibold">Rule</th>
                <th className="px-3 py-3 text-center font-semibold">Severity</th>
                <th className="px-3 py-3 font-semibold">File</th>
                <th className="px-3 py-3 text-center font-semibold">Line</th>
                <th className="px-3 py-3 font-semibold">Category</th>
                <th className="px-3 py-3 text-center font-semibold">CWE</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.finding_id}
                  className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-cyan-50/40"
                  onClick={() => onRowClick(row)}
                >
                  <td className="px-3 py-3">
                    <Tooltip title={row.rule_id}>
                      <Typography className="font-medium text-slate-800">{row.rule_id}</Typography>
                    </Tooltip>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <SeverityChip severity={row.severity} />
                  </td>
                  <td className="max-w-[380px] px-3 py-3">
                    <Typography className="block truncate font-mono text-xs text-slate-700">{row.file_path}</Typography>
                  </td>
                  <td className="px-3 py-3 text-center text-slate-700">{row.line_start}</td>
                  <td className="px-3 py-3 text-slate-700">{row.category}</td>
                  <td className="px-3 py-3 text-center text-slate-700">{row.cwe || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Box>
  );
};

export default FindingsTable;
