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
  const data = Object.entries(severity || {})
    .filter(([, count]) => count > 0)
    .map(([sev, count]) => ({
      id: sev,
      value: count,
      label: sev,
      color: COLORS[sev]
    }));

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  return (
    <Box className="rounded-xl border border-slate-200 bg-white p-4">
      <Typography className="mb-3 text-sm font-semibold text-slate-900">
        Severity Distribution
      </Typography>

      {data.length === 0 ? (
        <Typography className="text-sm text-slate-500">No severity data available.</Typography>
      ) : (
        <Box className="grid grid-cols-1 gap-4 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
          <Box className="mx-auto h-[180px] w-[180px]">
            <svg viewBox="0 0 120 120" className="h-full w-full">
              <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="14" />
              {data.map((item, idx) => {
                const valueLength = (item.value / total) * circumference;
                const offsetValue = data
                  .slice(0, idx)
                  .reduce((sum, s) => sum + (s.value / total) * circumference, 0);

                return (
                  <circle
                    key={item.id}
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="14"
                    strokeDasharray={`${valueLength} ${circumference - valueLength}`}
                    strokeDashoffset={-offsetValue}
                    transform="rotate(-90 60 60)"
                    strokeLinecap="butt"
                  />
                );
              })}
              <text x="60" y="56" textAnchor="middle" className="fill-slate-500 text-[8px] font-medium uppercase">
                Total
              </text>
              <text x="60" y="68" textAnchor="middle" className="fill-slate-900 text-[11px] font-semibold">
                {total}
              </text>
            </svg>
          </Box>

          <Box className="space-y-3">
            {data.map((item) => {
              const percentage = total ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={item.id} className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-slate-700">{item.label}</span>
                  </span>
                  <span className="text-slate-600">{item.value} ({percentage}%)</span>
                </div>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SeverityBreakdown;
