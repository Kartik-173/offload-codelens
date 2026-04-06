import React, { useState, useRef } from "react";
import { X, LayoutGrid, List, Download, Clock, Zap, CheckCircle, Database } from "lucide-react";

const Typography = ({ children, className = "" }) => <p className={className}>{children}</p>;
const Paper = ({ children, className = "" }) => <div className={`rounded-lg border bg-white p-4 shadow-sm ${className}`}>{children}</div>;

const SimpleLineChart = ({ data, labels, series }) => {
  const maxVal = Math.max(...series.flatMap(s => s.data));
  return (
    <div className="mt-4 space-y-2">
      {series.map((s, idx) => (
        <div key={s.label} className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: ["#4F46E5", "#FB923C", "#EC4899", "#0EA5E9"][idx % 4] }}
            />
            <span>{s.label}</span>
          </div>
          <div className="flex gap-0.5">
            {s.data.map((val, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${Math.max((val / maxVal) * 60, 2)}px`,
                  backgroundColor: ["#4F46E5", "#FB923C", "#EC4899", "#0EA5E9"][idx % 4],
                  opacity: 0.7 + (i / s.data.length) * 0.3,
                }}
                title={`${labels[i]}: ${val.toFixed(2)}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

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
      icon: <Clock size={20} className="text-indigo-600" />,
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
      icon: <Zap size={20} className="text-orange-400" />,
      stats: last && [`Latest: ${last.rps} rps`],
      series: [{ data: timeseries.map((t) => t.rps), label: "RPS" }],
    },
    {
      title: "Request Success %",
      icon: <CheckCircle size={20} className="text-green-600" />,
      stats: last && [`Latest: ${successPercent.at(-1).toFixed(1)}%`],
      series: [{ data: successPercent, label: "Success %" }],
    },
    {
      title: "Bytes In / Out",
      icon: <Database size={20} className="text-sky-500" />,
      stats: last && [`In: ${last.bytesIn}`, `Out: ${last.bytesOut}`],
      series: [
        { data: timeseries.map((t) => t.bytesIn), label: "Bytes In" },
        { data: timeseries.map((t) => t.bytesOut), label: "Bytes Out" },
      ],
    },
  ];


  return (
    <>
      <div className="api-performance-container" ref={containerRef}>
        <div className="api-perf-header flex items-center justify-between">
          <Typography className="api-perf-title text-lg font-semibold">API Performance</Typography>

          <div className="api-perf-controls flex items-center gap-2">
            <div className="flex rounded border">
              <button
                className={`flex items-center gap-1 px-3 py-1.5 text-sm ${layout === "grid" ? "bg-blue-100 text-blue-700" : "hover:bg-slate-50"}`}
                onClick={() => setLayout("grid")}
              >
                <LayoutGrid size={16} /> Grid
              </button>
              <button
                className={`flex items-center gap-1 px-3 py-1.5 text-sm ${layout === "list" ? "bg-blue-100 text-blue-700" : "hover:bg-slate-50"}`}
                onClick={() => setLayout("list")}
              >
                <List size={16} /> List
              </button>
            </div>

            <div className="relative">
              <button
                className="flex items-center gap-1 rounded border px-3 py-1.5 text-sm hover:bg-slate-50"
                onClick={openExportMenu}
              >
                <Download size={16} /> Export
              </button>
              {anchorEl && (
                <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded border bg-white py-1 shadow-lg">
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { exportCSV(); closeExportMenu(); }}>
                    Export CSV
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { exportJSON(); closeExportMenu(); }}>
                    Export JSON
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`grid gap-4 ${col === 6 ? "md:grid-cols-2" : "grid-cols-1"}`}>
          {chartCards.map((card) => (
            <Paper
              key={card.title}
              className="perf-card cursor-pointer"
              onClick={() =>
                openFullscreen(
                  card.title,
                  card.icon,
                  <SimpleLineChart data={timeseries} labels={timestamps} series={card.series} />
                )
              }
            >
              <div className="chart-title mb-2 flex items-center gap-2">
                {card.icon}
                <Typography className="font-medium">{card.title}</Typography>
              </div>

              {card.stats && (
                <div className="mini-stats mb-2 flex gap-2 text-xs text-slate-500">
                  {card.stats.map((s) => (
                    <span key={s} className="rounded bg-slate-100 px-2 py-1">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              <SimpleLineChart data={timeseries} labels={timestamps} series={card.series} />
            </Paper>
          ))}
        </div>
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div className="fullscreen-container mx-auto my-8 h-[90vh] w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-lg">
            <div className="fullscreen-header flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                {fullscreen?.icon}
                <Typography className="text-lg font-semibold">{fullscreen?.title}</Typography>
              </div>
              <button className="rounded p-1 hover:bg-slate-100" onClick={closeFullscreen}>
                <X size={20} />
              </button>
            </div>

            <div className="fullscreen-chart h-[calc(90vh-60px)] overflow-auto p-4">
              {fullscreen?.chart}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ApiPerformanceView;
