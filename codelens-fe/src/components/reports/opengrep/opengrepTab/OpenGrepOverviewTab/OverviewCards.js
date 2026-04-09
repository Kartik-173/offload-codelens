import React from "react";
import {
  Bug,
  CircleAlert,
  TriangleAlert,
  Info,
  CircleCheck,
} from "lucide-react";

const Box = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const Typography = ({ children, className = "" }) => (
  <p className={className}>{children}</p>
);

const CARDS = [
  {
    key: "TOTAL",
    label: "Total Findings",
    valueKey: "total_findings",
    icon: <Bug className="h-4 w-4" />,
    tone: "border-slate-200 bg-white text-slate-700"
  },
  {
    key: "CRITICAL",
    label: "Critical",
    icon: <CircleAlert className="h-4 w-4" />,
    tone: "border-rose-200 bg-rose-50 text-rose-700"
  },
  {
    key: "HIGH",
    label: "High",
    icon: <TriangleAlert className="h-4 w-4" />,
    tone: "border-orange-200 bg-orange-50 text-orange-700"
  },
  {
    key: "MEDIUM",
    label: "Medium",
    icon: <Info className="h-4 w-4" />,
    tone: "border-amber-200 bg-amber-50 text-amber-700"
  },
  {
    key: "LOW",
    label: "Low",
    icon: <CircleCheck className="h-4 w-4" />,
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700"
  }
];

const OverviewCards = ({ summary }) => {
  return (
    <Box className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {CARDS.map((card) => {
        const value = card.valueKey
          ? summary?.[card.valueKey] ?? 0
          : summary.severity_count?.[card.key] ?? 0;

        return (
          <Box
            key={card.key}
            className={`rounded-xl border px-4 py-3 ${card.tone}`}
          >
            <Box className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md border border-current/20 bg-white/60">
              {card.icon}
            </Box>

            <Typography className="text-xs uppercase tracking-wide text-slate-500">
              {card.label}
            </Typography>

            <Typography className="mt-1 text-2xl font-semibold text-slate-900">
              {value}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default OverviewCards;
