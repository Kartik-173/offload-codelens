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

const SeverityChip = ({ severity }) => (
  <Chip
    label={severity}
    size="small"
    className={`severity-chip ${severity.toLowerCase()}`}
  />
);

const FindingsTable = ({ rows, onRowClick }) => {
  return (
    <Box className={`findings-table ${rows.length === 0 ? "is-empty" : ""}`}>
      {rows.length === 0 ? (
        <div className="p-4 text-sm text-slate-500">No findings detected 🎉</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                <th className="px-3 py-2">Rule</th>
                <th className="px-3 py-2 text-center">Severity</th>
                <th className="px-3 py-2">File</th>
                <th className="px-3 py-2 text-center">Line</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2 text-center">CWE</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.finding_id}
                  className="cursor-pointer border-b hover:bg-slate-50"
                  onClick={() => onRowClick(row)}
                >
                  <td className="px-3 py-2">
                    <Tooltip title={row.rule_id}>
                      <Typography className="rule-cell">{row.rule_id}</Typography>
                    </Tooltip>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <SeverityChip severity={row.severity} />
                  </td>
                  <td className="px-3 py-2">
                    <Typography className="file-cell">{row.file_path}</Typography>
                  </td>
                  <td className="px-3 py-2 text-center">{row.line_start}</td>
                  <td className="px-3 py-2">{row.category}</td>
                  <td className="px-3 py-2 text-center">{row.cwe || "-"}</td>
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
