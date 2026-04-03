import React from "react";
import { Box, Typography } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import CodeIcon from "@mui/icons-material/Code";

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

  return (
    <Box className="language-panel">
      <Typography className="panel-title">
        <CodeIcon fontSize="small" />
        Languages
      </Typography>

      <Box className="language-chart-wrapper">
        <PieChart
          series={[
            {
              data,
              innerRadius: 65,
              outerRadius: 120,
              paddingAngle: 4,
              cornerRadius: 6,
              startAngle: -90,
              endAngle: 270
            }
          ]}
          width={300}
          height={260}
          slotProps={{
            legend: { hidden: true }
          }}
        />
      </Box>
    </Box>
  );
};

export default LanguageSummary;
