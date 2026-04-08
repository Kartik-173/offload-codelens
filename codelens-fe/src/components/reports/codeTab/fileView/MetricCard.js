import React from "react";

const Box = ({ children, className = "" }) => <div className={className}>{children}</div>;
const Paper = ({ children, className = "" }) => <div className={className}>{children}</div>;
const Typography = ({ children, className = "" }) => <p className={className}>{children}</p>;

const MetricCard = ({ label, value, children }) => {
  return (
    <Paper className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm">
      <Box className="flex items-baseline gap-1.5">
        <Typography className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          {label}
        </Typography>
        <Typography className="text-sm font-semibold text-slate-900">
          {value}
        </Typography>
      </Box>
      {children}
    </Paper>
  );
};

export default MetricCard;
