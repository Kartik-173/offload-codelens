import React from "react";
import { Box, Typography } from "@mui/material";
import BugReportOutlinedIcon from "@mui/icons-material/BugReportOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const CARDS = [
  {
    key: "TOTAL",
    label: "Total Findings",
    valueKey: "total_findings",
    icon: <BugReportOutlinedIcon />,
    className: "card-total"
  },
  {
    key: "CRITICAL",
    label: "Critical",
    icon: <ErrorOutlineIcon />,
    className: "card-critical"
  },
  {
    key: "HIGH",
    label: "High",
    icon: <WarningAmberOutlinedIcon />,
    className: "card-high"
  },
  {
    key: "MEDIUM",
    label: "Medium",
    icon: <InfoOutlinedIcon />,
    className: "card-medium"
  },
  {
    key: "LOW",
    label: "Low",
    icon: <CheckCircleOutlineIcon />,
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
