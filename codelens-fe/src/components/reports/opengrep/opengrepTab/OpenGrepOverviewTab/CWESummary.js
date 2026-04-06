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
      <Box className="cwe-panel">
        <Typography className="panel-title">
          <SecurityIcon className="h-4 w-4" />
          CWE Summary
        </Typography>
        <Typography className="cwe-empty">
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
    <Box className="cwe-panel">
      <Typography className="panel-title">
        <SecurityIcon className="h-4 w-4" />
        Top CWEs
      </Typography>

      <Box className="cwe-scroll">
        <Box className="cwe-list">
          {entries.map(([id, count]) => (
            <Box key={id} className="cwe-item">
              <Box className="cwe-header">
                <Typography className="cwe-id">{id}</Typography>
                <Typography className="cwe-count">{count}</Typography>
              </Box>

              <Typography className="cwe-name">
                {CWE_LABELS[id] || "Security Weakness"}
              </Typography>

              <div className="cwe-bar h-2 w-full overflow-hidden rounded bg-slate-200">
                <div
                  className="h-full bg-blue-600"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default CWESummary;
