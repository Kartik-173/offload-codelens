import React from "react";
import { Box, Paper, Typography } from "@mui/material";

const MetricCard = ({ label, value, children }) => {
  return (
    <Paper elevation={0} className="file-view-metric-card">
      <Box className="file-view-metric-content">
        <Typography variant="caption" className="file-view-metric-label">
          {label}
        </Typography>
        <Typography variant="body1" className="file-view-metric-value">
          {value}
        </Typography>
      </Box>
      {children}
    </Paper>
  );
};

export default MetricCard;
