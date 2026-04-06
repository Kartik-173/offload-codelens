import React from "react";

const Box = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const Typography = ({ children, className = "" }) => (
  <p className={className}>{children}</p>
);

const COLORS = {
  CRITICAL: "#dc2626",
  HIGH: "#ea580c",
  MEDIUM: "#ca8a04",
  LOW: "#16a34a"
};

const SeverityBreakdown = ({ severity }) => {
  const data = Object.entries(severity)
    .filter(([, count]) => count > 0)
    .map(([sev, count]) => ({
      id: sev,
      value: count,
      label: sev,
      color: COLORS[sev]
    }));

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Box className="opengrep-overview-container">
      <Box className="severity-panel">
        <Typography className="panel-title">
          Severity Distribution
        </Typography>

        <Box className="severity-chart-wrapper space-y-3">
          {data.map((item) => {
            const percentage = total ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium" style={{ color: item.color }}>{item.label}</span>
                  <span>{item.value} ({percentage}%)</span>
                </div>
                <div className="h-2 rounded bg-slate-100">
                  <div className="h-2 rounded" style={{ width: `${percentage}%`, backgroundColor: item.color }} />
                </div>
              </div>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default SeverityBreakdown;
