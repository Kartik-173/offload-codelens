import React from "react";
import { Box, Typography } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";

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

  return (
    <Box className="opengrep-overview-container">
      <Box className="severity-panel">
        <Typography className="panel-title">
          Severity Distribution
        </Typography>

        <Box className="severity-chart-wrapper">
          <PieChart
            series={[
              {
                data,
                innerRadius: 70,
                outerRadius: 120,
                paddingAngle: 4,
                cornerRadius: 6,
                startAngle: -90,
                endAngle: 270
              }
            ]}
            width={320}
            height={280}
            slotProps={{
              legend: { hidden: true }
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default SeverityBreakdown;
