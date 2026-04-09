import React, { useEffect, useRef, useState } from "react";
import {
  X,
  LayoutGrid,
  List,
  Download,
  Clock,
  Zap,
  CheckCircle,
  Database,
  Expand,
} from "lucide-react";

const Typography = ({ children, className = "" }) => <p className={className}>{children}</p>;
const Paper = ({ children, className = "" }) => <div className={`rounded-lg border bg-white p-4 shadow-sm ${className}`}>{children}</div>;

const SERIES_COLORS = ["#4F46E5", "#F97316", "#EC4899", "#0EA5E9"];

const formatAxisLabel = (raw) => {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return String(raw);
  return parsed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const formatDuration = (start, end) => {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return null;

  const totalSeconds = Math.round((endMs - startMs) / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

const formatMetricValue = (value) => {
  if (!Number.isFinite(value)) return "-";
  if (Math.abs(value) >= 1000) return value.toFixed(0);
  if (Math.abs(value) >= 100) return value.toFixed(1);
  return value.toFixed(2);
};

const SimpleLineChart = ({ labels, series }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const svgRef = useRef(null);
  const values = series.flatMap((s) => s.data).filter((v) => Number.isFinite(v));
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal;
  const pad = range === 0 ? Math.max(maxVal * 0.1, 1) : range * 0.12;
  const chartMin = Math.max(0, minVal - pad);
  const chartMax = maxVal + pad;
  const chartRange = Math.max(chartMax - chartMin, 1);
  const width = 620;
  const height = 210;
  const padL = 40;
  const padR = 12;
  const padT = 12;
  const padB = 34;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const xStep = Math.max(innerW / Math.max(labels.length - 1, 1), 1);

  const getX = (idx) => padL + idx * xStep;
  const getY = (value) => padT + innerH - ((Math.max(value, chartMin) - chartMin) / chartRange) * innerH;

  const toPath = (values) =>
    values
      .map((value, idx) => {
        const x = getX(idx);
        const y = getY(value);
        return `${idx === 0 ? "M" : "L"}${x} ${y}`;
      })
      .join(" ");

  const axisLabelIndexes = Array.from({ length: Math.min(6, labels.length) }, (_, i) =>
    Math.round((i * (labels.length - 1)) / Math.max(Math.min(6, labels.length) - 1, 1))
  ).filter((idx, pos, arr) => idx >= 0 && arr.indexOf(idx) === pos);

  const yTicks = Array.from({ length: 5 }, (_, idx) => {
    const ratio = idx / 4;
    const value = chartMax - ratio * chartRange;
    return { ratio, value };
  });

  const handleMouseMove = (event) => {
    if (!svgRef.current || labels.length === 0) return;

    const rect = svgRef.current.getBoundingClientRect();
    const xInViewBox = ((event.clientX - rect.left) / rect.width) * width;
    const idx = Math.round((xInViewBox - padL) / xStep);
    const bounded = Math.max(0, Math.min(labels.length - 1, idx));
    setHoveredIdx(bounded);
  };

  const handleMouseLeave = () => setHoveredIdx(null);

  const hasHover = hoveredIdx !== null && hoveredIdx >= 0 && hoveredIdx < labels.length;

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
        {series.map((s, idx) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SERIES_COLORS[idx % SERIES_COLORS.length] }} />
            {s.label}
          </span>
        ))}
      </div>

      <div className="relative w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2">
        {hasHover && (
          <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-md border border-slate-200 bg-white/95 px-2 py-1.5 text-xs text-slate-700 shadow-sm backdrop-blur-sm">
            <div className="mb-1 font-medium text-slate-800">{formatAxisLabel(labels[hoveredIdx])}</div>
            <div className="space-y-0.5">
              {series.map((s, idx) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SERIES_COLORS[idx % SERIES_COLORS.length] }} />
                  <span>{s.label}</span>
                  <span className="font-medium text-slate-900">{formatMetricValue(s.data[hoveredIdx])}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full aspect-[620/165]"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {yTicks.map((tick) => {
            const y = padT + tick.ratio * innerH;
            return (
              <g key={tick.ratio}>
                <line x1={padL} x2={width - padR} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                <text x={padL - 6} y={y + 3} textAnchor="end" className="fill-slate-500 text-[10px]">
                  {formatMetricValue(tick.value)}
                </text>
              </g>
            );
          })}

          <line x1={padL} y1={padT} x2={padL} y2={height - padB} stroke="#cbd5e1" strokeWidth="1" />
          <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke="#cbd5e1" strokeWidth="1" />

          {axisLabelIndexes.map((idx) => (
            <text
              key={`x-${idx}`}
              x={getX(idx)}
              y={height - 8}
              textAnchor="middle"
              className="fill-slate-500 text-[10px]"
            >
              {formatAxisLabel(labels[idx])}
            </text>
          ))}

          {series.map((s, idx) => (
            <path
              key={s.label}
              d={toPath(s.data)}
              fill="none"
              stroke={SERIES_COLORS[idx % SERIES_COLORS.length]}
              strokeWidth="2.25"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {hasHover && (
            <line
              x1={getX(hoveredIdx)}
              x2={getX(hoveredIdx)}
              y1={padT}
              y2={height - padB}
              stroke="#94a3b8"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          )}

          {hasHover &&
            series.map((s, idx) => (
              <circle
                key={`${s.label}-hover`}
                cx={getX(hoveredIdx)}
                cy={getY(s.data[hoveredIdx])}
                r="3.25"
                fill="white"
                stroke={SERIES_COLORS[idx % SERIES_COLORS.length]}
                strokeWidth="2"
              />
            ))}

          <rect
            x={padL}
            y={padT}
            width={innerW}
            height={innerH}
            fill="transparent"
          />
        </svg>
      </div>
    </div>
  );
};

const ApiPerformanceView = ({ report }) => {
  const [fullscreen, setFullscreen] = useState(null);
  const [layout, setLayout] = useState("grid");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef(null);

  const openExportMenu = () => setIsExportOpen((prev) => !prev);
  const closeExportMenu = () => setIsExportOpen(false);

  useEffect(() => {
    if (!isExportOpen) return;

    const handleOutsideClick = (event) => {
      if (!exportRef.current) return;
      if (!exportRef.current.contains(event.target)) {
        closeExportMenu();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") closeExportMenu();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isExportOpen]);

  const timeseries = report?.data?.timeseries || [];
  if (!timeseries.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
        No time-series performance data available for this report.
      </div>
    );
  }

  const timestamps = timeseries.map((t) => t.timestamp);
  const last = timeseries.at(-1);
  const durationLabel = formatDuration(timestamps[0], timestamps[timestamps.length - 1]);

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
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-indigo-50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Typography className="text-base font-semibold text-slate-900">API Performance</Typography>
              <Typography className="mt-0.5 text-xs text-slate-600">
                Time-series latency, throughput, success rate, and network transfer analysis.
              </Typography>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 bg-white">
                <button
                  className={`flex items-center gap-1 rounded-l-lg px-3 py-1.5 text-sm ${layout === "grid" ? "bg-sky-100 text-sky-700" : "text-slate-600 hover:bg-slate-50"}`}
                  onClick={() => setLayout("grid")}
                >
                  <LayoutGrid size={16} /> Grid
                </button>
                <button
                  className={`flex items-center gap-1 rounded-r-lg px-3 py-1.5 text-sm ${layout === "list" ? "bg-sky-100 text-sky-700" : "text-slate-600 hover:bg-slate-50"}`}
                  onClick={() => setLayout("list")}
                >
                  <List size={16} /> List
                </button>
              </div>

              <div className="relative" ref={exportRef}>
                <button
                  className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                  onClick={openExportMenu}
                >
                  <Download size={16} /> Export
                </button>
                {isExportOpen && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
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

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600">
              Samples: <strong className="ml-1 text-slate-800">{timeseries.length}</strong>
            </span>
            {durationLabel && (
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600">
                Duration: <strong className="ml-1 text-slate-800">{durationLabel}</strong>
              </span>
            )}
          </div>
        </div>

        <div className={`grid gap-4 ${col === 6 ? "md:grid-cols-2" : "grid-cols-1"}`}>
          {chartCards.map((card) => (
            (() => {
              const chartNode = <SimpleLineChart labels={timestamps} series={card.series} />;
              const handleExpand = (event) => {
                event?.stopPropagation?.();
                openFullscreen(card.title, card.icon, chartNode);
              };

              return (
                <Paper
                  key={card.title}
                  className="w-full cursor-pointer border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  onClick={handleExpand}
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {card.icon}
                      <Typography className="font-medium text-slate-900">{card.title}</Typography>
                    </div>
                    <button
                      type="button"
                      onClick={handleExpand}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100"
                    >
                      <Expand size={12} /> Expand
                    </button>
                  </div>

                  {card.stats && (
                    <div className="mb-2 flex flex-wrap gap-2 text-xs text-slate-500">
                      {card.stats.map((s) => (
                        <span key={s} className="rounded bg-slate-100 px-2 py-1">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {chartNode}
                </Paper>
              );
            })()
          ))}
        </div>
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[1px]">
          <div className="mx-auto h-[90vh] w-full max-w-[88vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                {fullscreen?.icon}
                <Typography className="text-lg font-semibold">{fullscreen?.title}</Typography>
              </div>
              <button className="rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-slate-800" onClick={closeFullscreen}>
                <X size={20} />
              </button>
            </div>

            <div className="h-[calc(90vh-60px)] overflow-auto p-4">
              {fullscreen?.chart}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ApiPerformanceView;
