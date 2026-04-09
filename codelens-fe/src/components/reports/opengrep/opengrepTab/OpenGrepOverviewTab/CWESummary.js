import React from "react";
import { ShieldAlert as SecurityIcon } from "lucide-react";
import { CWE_LABELS } from "../../../../../utils/Helpers";

const Box = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const Typography = ({ children, className = "" }) => (
  <p className={className}>{children}</p>
);

const CWESummary = ({ cwe }) => {
  if (!cwe || Object.keys(cwe).length === 0) {
    return (
      <Box className="rounded-xl border border-slate-200 bg-white p-4">
        <Typography className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <SecurityIcon className="h-4 w-4 text-rose-600" />
          CWE Summary
        </Typography>
        <Typography className="text-sm text-slate-500">
          No CWE data available
        </Typography>
      </Box>
    );
  }

  const entries = Object.entries(cwe)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  const max = Math.max(...entries.map(([, v]) => v));

  return (
    <Box className="rounded-xl border border-slate-200 bg-white p-4">
      <Typography className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <SecurityIcon className="h-4 w-4 text-rose-600" />
        Top CWEs
      </Typography>

      <Box className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
        {entries.map(([id, count]) => (
          <Box key={id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <Box className="flex items-center justify-between">
              <Typography className="text-xs font-semibold text-slate-700">{id}</Typography>
              <Typography className="text-xs font-semibold text-slate-900">{count}</Typography>
            </Box>

            <Typography className="mt-1 text-xs text-slate-600">
              {CWE_LABELS[id] || "Security Weakness"}
            </Typography>

            <div className="mt-2 h-2 w-full overflow-hidden rounded bg-slate-200">
              <div
                className="h-full bg-blue-600"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default CWESummary;
