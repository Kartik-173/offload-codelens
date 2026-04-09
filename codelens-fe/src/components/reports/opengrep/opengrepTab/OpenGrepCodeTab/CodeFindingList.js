import React from "react";

const Box = ({ children, className = "", onClick }) => (
  <div className={className} onClick={onClick}>{children}</div>
);

const Typography = ({ children, className = "", title }) => (
  <p className={className} title={title}>{children}</p>
);

const SEVERITY_CLASS = {
  CRITICAL: "border-rose-200 bg-rose-50 text-rose-700",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const CodeFindingList = ({ findings, selectedFinding, onSelect }) => {
  if (!findings.length) {
    return (
      <Box className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        No findings match the selected filter.
      </Box>
    );
  }

  return (
    <Box className="max-h-[68vh] space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
      {findings.map((f, idx) => {
        const isActive = selectedFinding === f;

        return (
          <Box
            key={idx}
            className={`cursor-pointer rounded-lg border p-3 transition-colors ${
              isActive
                ? "border-cyan-300 bg-cyan-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
            onClick={() => onSelect(f)}
          >
            <Box className="flex items-start justify-between gap-2">
              <Typography className="max-w-[220px] truncate font-mono text-xs text-slate-700" title={f.file_path}>
                {f.file_path}
              </Typography>

              <span
                className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                  SEVERITY_CLASS[f.severity?.toUpperCase?.()] || "border-slate-200 bg-slate-50 text-slate-700"
                }`}
              >
                {f.severity}
              </span>
            </Box>

            <Typography className="mt-1 truncate text-xs font-medium text-slate-900">
              {f.rule_id}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default CodeFindingList;
