import React from "react";

const Box = ({ children, className = "" }) => <div className={className}>{children}</div>;
const Paper = ({ children, className = "" }) => <div className={className}>{children}</div>;
const Typography = ({ children, className = "" }) => <p className={className}>{children}</p>;

const MetricCard = ({ label, value, children }) => {
  return (
    <Paper className="file-view-metric-card">
      <Box className="file-view-metric-content">
        <Typography className="file-view-metric-label">
          {label}
        </Typography>
        <Typography className="file-view-metric-value">
          {value}
        </Typography>
      </Box>
      {children}
    </Paper>
  );
};

export default MetricCard;
