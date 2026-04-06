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
    className: "card-total"
  },
  {
    key: "CRITICAL",
    label: "Critical",
    icon: <CircleAlert className="h-4 w-4" />,
    className: "card-critical"
  },
  {
    key: "HIGH",
    label: "High",
    icon: <TriangleAlert className="h-4 w-4" />,
    className: "card-high"
  },
  {
    key: "MEDIUM",
    label: "Medium",
    icon: <Info className="h-4 w-4" />,
    className: "card-medium"
  },
  {
    key: "LOW",
    label: "Low",
    icon: <CircleCheck className="h-4 w-4" />,
    className: "card-low"
  }
];

const OverviewCards = ({ summary }) => {
  return (
    <Box className="opengrep-overview-cards">
      {CARDS.map((card) => {
        const value = card.valueKey
          ? summary[card.valueKey]
          : summary.severity_count?.[card.key] ?? 0;

        return (
          <Box
            key={card.key}
            className={`overview-card ${card.className}`}
          >
            <Box className="overview-card-icon">
              {card.icon}
            </Box>

            <Typography className="overview-card-label">
              {card.label}
            </Typography>

            <Typography className="overview-card-value">
              {value}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default OverviewCards;
