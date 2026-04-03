import React from "react";
import {
  Grid,
  Paper,
  Typography,
  Divider,
  Chip,
  Fade,
  IconButton,
  Tooltip,
} from "@mui/material";

import { BarChart, PieChart } from "@mui/x-charts";

import HttpIcon from "@mui/icons-material/Http";
import SpeedIcon from "@mui/icons-material/Speed";
import BoltIcon from "@mui/icons-material/Bolt";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import TimelineIcon from "@mui/icons-material/Timeline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import BarChartIcon from "@mui/icons-material/BarChart";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";

const ApiSummaryView = ({ report }) => {
  const summary = report?.data?.summary;
  const result = report?.data?.result;

  if (!summary || !result) return null;

  const latencyBars = [
    { label: "P50", value: result.latencies["50th"] / 1e6 },
    { label: "P90", value: result.latencies["90th"] / 1e6 },
    { label: "P95", value: result.latencies["95th"] / 1e6 },
    { label: "P99", value: result.latencies["99th"] / 1e6 },
    { label: "MAX", value: result.latencies.max / 1e6 },
  ];

  const statusData = Object.entries(result.status_codes || {}).map(
    ([code, count]) => ({
      id: code,
      label: code,
      value: count,
    })
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(summary.url);
  };

  return (
    <div className="api-summary-container">
      {/* HEADER */}
      <Fade in timeout={400}>
        <div className="api-summary-header">
          <div className="header-left">
            <HttpIcon className="http-icon" />
            <div>
              <Typography className="summary-title">
                Load Test Summary
              </Typography>
              <Typography className="method-text">
                {summary.method}
              </Typography>
            </div>
          </div>

          <div className="url-row">
            <Typography className="target-url">{summary.url}</Typography>
            <Tooltip title="Copy URL">
              <IconButton
                size="small"
                className="copy-btn"
                onClick={handleCopy}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      </Fade>

      {/* METRICS */}
      <Grid container spacing={3}>
        {[
          { label: "Requested Rate", value: `${summary.requestedRate}/sec`, icon: <SpeedIcon /> },
          { label: "Requests Sent", value: summary.requests, icon: <BoltIcon /> },
          { label: "Success Ratio", value: `${summary.successRatio * 100}%`, icon: <QueryStatsIcon /> },
          { label: "Avg Latency", value: `${summary.avgLatencyMs.toFixed(2)} ms`, icon: <TimelineIcon /> },
          { label: "P95 Latency", value: `${summary.p95LatencyMs.toFixed(2)} ms`, icon: <TimelineIcon /> },
          { label: "Max Latency", value: `${summary.maxLatencyMs.toFixed(2)} ms`, icon: <TimelineIcon /> },
        ].map((m, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
            <Paper className="metric-card">
              <div className="metric-icon">{m.icon}</div>
              <Typography className="metric-value">{m.value}</Typography>
              <Typography className="metric-label">{m.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Divider className="api-divider" />

      {/* CHARTS */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper className="chart-card">
            <div className="chart-header">
              <BarChartIcon />
              <Typography>Latency Percentiles (ms)</Typography>
            </div>

            <BarChart
              height={320}
              dataset={latencyBars}
              xAxis={[{ scaleType: "band", dataKey: "label" }]}
              series={[
                {
                  dataKey: "value",
                  label: (location) => `${location} latency`,
                },
              ]}
              className="mui-chart latency-chart"
            />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper className="chart-card">
            <div className="chart-header">
              <DonutLargeIcon />
              <Typography>Status Code Distribution</Typography>
            </div>

            <PieChart
              height={320}
              series={[
                {
                  data: statusData,
                  innerRadius: 60,
                  outerRadius: 120,
                  paddingAngle: 5,
                  cornerRadius: 6,
                  arcLabel: (item) => item.label,
                },
              ]}
              className="mui-chart"
            />
          </Paper>
        </Grid>
      </Grid>

      <Divider className="api-divider" />

      {/* STATUS + ERRORS */}
      <div className="status-error-wrapper">
        <div className="status-section">
          <Typography className="section-title">Status Codes</Typography>
          <div className="status-pills">
            {statusData.map((s) => (
              <div key={s.id} className="status-pill error">
                <WarningAmberIcon />
                {s.label} — {s.value}
              </div>
            ))}
          </div>
        </div>

        <div className="error-section">
          <Typography className="section-title">Errors</Typography>
          {result.errors?.length ? (
            result.errors.map((e, i) => (
              <div key={i} className="error-alert">
                <ErrorOutlineIcon />
                {e}
              </div>
            ))
          ) : (
            <div className="success-alert">
              <CheckCircleIcon />
              No Errors Detected
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiSummaryView;
