import React, { useState, useRef } from "react";
import {
  Grid,
  Paper,
  Typography,
  Dialog,
  IconButton,
  ButtonGroup,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda";
import DownloadIcon from "@mui/icons-material/Download";

import { LineChart } from "@mui/x-charts";

import TimelineIcon from "@mui/icons-material/Timeline";
import SpeedIcon from "@mui/icons-material/Speed";
import DataUsageIcon from "@mui/icons-material/DataUsage";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const ApiPerformanceView = ({ report }) => {
  const [fullscreen, setFullscreen] = useState(null);
  const [layout, setLayout] = useState("grid");
  const [anchorEl, setAnchorEl] = useState(null);

  const containerRef = useRef(null);

  const openExportMenu = (e) => setAnchorEl(e.currentTarget);
  const closeExportMenu = () => setAnchorEl(null);

  const timeseries = report?.data?.timeseries || [];
  if (!timeseries.length) return null;

  const timestamps = timeseries.map((t) => t.timestamp);
  const last = timeseries.at(-1);

  const successPercent = timeseries.map((t) =>
    t.rps === 0 ? 0 : (t.success / t.rps) * 100
  );

  const openFullscreen = (title, icon, chart) =>
    setFullscreen({ title, icon, chart });

  const closeFullscreen = () => setFullscreen(null);

  const downloadFile = (name, content, type) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = Object.keys(timeseries[0]).join(",");
    const rows = timeseries.map((t) => Object.values(t).join(","));
    downloadFile("api_report.csv", [headers, ...rows].join("\n"), "text/csv");
  };

  const exportJSON = () => {
    downloadFile(
      "api_report.json",
      JSON.stringify(timeseries, null, 2),
      "application/json"
    );
  };

  const chartPalette = ["#4F46E5", "#FB923C", "#EC4899", "#0EA5E9"];

  const chartCommon = {
    height: 300,
    xAxis: [{ scaleType: "point", data: timestamps, labelAngle: -45 }],
    colors: chartPalette,
    sx: {
      ".MuiLineElement-root": { strokeWidth: 2 },
      ".MuiMark-root": { r: 3 },
      ".MuiChartsTooltip-root": { fontSize: "0.85rem" },
    },
  };

  const col = layout === "grid" ? 6 : 12;

  const chartCards = [
    {
      title: "Latency",
      icon: <TimelineIcon sx={{ color: "#4F46E5" }} />,
      stats: last && [
        `Avg: ${last.avgLatencyMs.toFixed(2)} ms`,
        `P95: ${last.p95LatencyMs.toFixed(2)} ms`,
        `Max: ${last.p99LatencyMs.toFixed(2)} ms`,
      ],
      series: [
        { data: timeseries.map((t) => t.avgLatencyMs), label: "Avg" },
        { data: timeseries.map((t) => t.p90LatencyMs), label: "P90" },
        { data: timeseries.map((t) => t.p95LatencyMs), label: "P95" },
        { data: timeseries.map((t) => t.p99LatencyMs), label: "P99" },
      ],
    },
    {
      title: "Requests Per Second",
      icon: <SpeedIcon sx={{ color: "#FB923C" }} />,
      stats: last && [`Latest: ${last.rps} rps`],
      series: [{ data: timeseries.map((t) => t.rps), label: "RPS" }],
    },
    {
      title: "Request Success %",
      icon: <CheckCircleIcon sx={{ color: "#16A34A" }} />,
      stats: last && [`Latest: ${successPercent.at(-1).toFixed(1)}%`],
      series: [{ data: successPercent, label: "Success %" }],
    },
    {
      title: "Bytes In / Out",
      icon: <DataUsageIcon sx={{ color: "#0EA5E9" }} />,
      stats: last && [`In: ${last.bytesIn}`, `Out: ${last.bytesOut}`],
      series: [
        { data: timeseries.map((t) => t.bytesIn), label: "Bytes In", area: true },
        { data: timeseries.map((t) => t.bytesOut), label: "Bytes Out", area: true },
      ],
    },
  ];


  return (
    <>
      <div className="api-performance-container" ref={containerRef}>
        <div className="api-perf-header">
          <Typography variant="h6" className="api-perf-title">
            API Performance
          </Typography>

          <div className="api-perf-controls">
            <ButtonGroup>
              <Button
                className={`api-perf-btn ${layout === "grid" ? "active" : ""}`}
                onClick={() => setLayout("grid")}
                startIcon={<ViewModuleIcon />}
              >
                Grid
              </Button>
              <Button
                className={`api-perf-btn ${layout === "list" ? "active" : ""}`}
                onClick={() => setLayout("list")}
                startIcon={<ViewAgendaIcon />}
              >
                List
              </Button>
            </ButtonGroup>

            <Button
              className="api-perf-btn export-btn"
              onClick={openExportMenu}
              startIcon={<DownloadIcon />}
            >
              Export
            </Button>

            <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={closeExportMenu}>
              <MenuItem onClick={() => { exportCSV(); closeExportMenu(); }}>
                Export CSV
              </MenuItem>
              <MenuItem onClick={() => { exportJSON(); closeExportMenu(); }}>
                Export JSON
              </MenuItem>
            </Menu>
          </div>
        </div>

        <Grid container spacing={3}>
          {chartCards.map((card) => (
            <Grid key={card.title} size={{ xs: 12, md: col }}>
              <Paper
                className="perf-card"
                onClick={() =>
                  openFullscreen(
                    card.title,
                    card.icon,
                    <LineChart {...chartCommon} series={card.series} />
                  )
                }
              >
                <div className="chart-title">
                  {card.icon}
                  <Typography>{card.title}</Typography>
                </div>

                {card.stats && (
                  <div className="mini-stats">
                    {card.stats.map((s) => (
                      <span key={s}>
                        <b>{s}</b>
                      </span>
                    ))}
                  </div>
                )}

                <LineChart {...chartCommon} series={card.series} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </div>

      <Dialog fullScreen open={!!fullscreen} onClose={closeFullscreen}>
        <div className="fullscreen-container">
          <div className="fullscreen-header">
            {fullscreen?.icon}
            <Typography>{fullscreen?.title}</Typography>
            <IconButton onClick={closeFullscreen}>
              <CloseIcon />
            </IconButton>
          </div>

          <div className="fullscreen-chart">{fullscreen?.chart}</div>
        </div>
      </Dialog>
    </>
  );
};

export default ApiPerformanceView;
