import React from "react";
import { Code } from "lucide-react";

const Box = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const Typography = ({ children, className = "" }) => (
  <p className={className}>{children}</p>
);

const LANGUAGE_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#f59e0b",
  "#22c55e",
  "#ef4444",
  "#0ea5e9",
  "#a855f7"
];

const LanguageSummary = ({ languages }) => {
  if (!languages || Object.keys(languages).length === 0) {
    return null;
  }

  const data = Object.entries(languages).map(
    ([lang, count], index) => ({
      id: lang,
      value: count,
      label: lang,
      color: LANGUAGE_COLORS[index % LANGUAGE_COLORS.length]
    })
  );

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Box className="language-panel">
      <Typography className="panel-title">
        <Code className="h-4 w-4" />
        Languages
      </Typography>

      <Box className="language-chart-wrapper space-y-3">
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
  );
};

export default LanguageSummary;
