import React from "react";
import {
  BarChart3,
  PieChart as PieChartIcon,
  Globe,
  Gauge,
  Zap,
  Activity,
  Clock,
  AlertCircle,
  Copy,
  CheckCircle,
  AlertTriangle,
  BarChart2,
  Donut,
} from "lucide-react";

const Typography = ({ children, className = "" }) => <p className={className}>{children}</p>;
const Chip = ({ children, className = "" }) => <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${className}`}>{children}</span>;
const Fade = ({ children }) => <div className="transition-opacity duration-300">{children}</div>;
const Paper = ({ children, className = "" }) => <div className={`rounded-lg border bg-white p-4 shadow-sm ${className}`}>{children}</div>;

const SimpleBarChart = ({ data }) => (
  <div className="mt-4 space-y-2">
    {data.map((item) => (
      <div key={item.label} className="flex items-center gap-2">
        <span className="w-12 text-xs text-slate-500">{item.label}</span>
        <div className="flex-1">
          <div
            className="h-6 rounded bg-blue-500"
            style={{ width: `${Math.min((item.value / (data[4]?.value || 1)) * 100, 100)}%` }}
          />
        </div>
        <span className="w-16 text-right text-xs font-medium">{item.value.toFixed(2)}ms</span>
      </div>
    ))}
  </div>
);

const SimplePieChart = ({ data }) => (
  <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
    {data.map((item) => (
      <div key={item.id} className="flex items-center gap-2">
        <div
          className="h-4 w-4 rounded-full"
          style={{ backgroundColor: item.id === "200" ? "#22c55e" : "#ef4444" }}
        />
        <span className="text-sm">
          {item.label}: {item.value}
        </span>
      </div>
    ))}
  </div>
);

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

  const maxLatency = Math.max(...latencyBars.map(d => d.value));

  return (
    <div className="api-summary-container">
      {/* HEADER */}
      <Fade in timeout={400}>
        <div className="api-summary-header">
          <div className="header-left flex items-center gap-3">
            <Globe className="http-icon h-6 w-6 text-blue-500" />
            <div>
              <Typography className="summary-title text-lg font-semibold">
                Load Test Summary
              </Typography>
              <Typography className="method-text text-sm text-slate-500">
                {summary.method}
              </Typography>
            </div>
          </div>

          <div className="url-row flex items-center gap-2">
            <Typography className="target-url text-sm text-slate-600">{summary.url}</Typography>
            <button
              className="copy-btn rounded p-1 hover:bg-slate-100"
              onClick={handleCopy}
              title="Copy URL"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>
      </Fade>

      {/* METRICS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Requested Rate", value: `${summary.requestedRate}/sec`, icon: <Gauge size={20} /> },
          { label: "Requests Sent", value: summary.requests, icon: <Zap size={20} /> },
          { label: "Success Ratio", value: `${summary.successRatio * 100}%`, icon: <Activity size={20} /> },
          { label: "Avg Latency", value: `${summary.avgLatencyMs.toFixed(2)} ms`, icon: <Clock size={20} /> },
          { label: "P95 Latency", value: `${summary.p95LatencyMs.toFixed(2)} ms`, icon: <Clock size={20} /> },
          { label: "Max Latency", value: `${summary.maxLatencyMs.toFixed(2)} ms`, icon: <Clock size={20} /> },
        ].map((m, i) => (
          <Paper key={i} className="metric-card">
            <div className="metric-icon mb-2 text-blue-500">{m.icon}</div>
            <Typography className="metric-value text-lg font-semibold">{m.value}</Typography>
            <Typography className="metric-label text-sm text-slate-500">{m.label}</Typography>
          </Paper>
        ))}
      </div>

      <hr className="api-divider my-6 border-slate-200" />

      {/* CHARTS */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Paper className="chart-card">
          <div className="chart-header mb-4 flex items-center gap-2">
            <BarChart2 size={20} />
            <Typography>Latency Percentiles (ms)</Typography>
          </div>
          <SimpleBarChart data={latencyBars} />
        </Paper>

        <Paper className="chart-card">
          <div className="chart-header mb-4 flex items-center gap-2">
            <Donut size={20} />
            <Typography>Status Code Distribution</Typography>
          </div>
          <SimplePieChart data={statusData} />
        </Paper>
      </div>

      <hr className="api-divider my-6 border-slate-200" />

      {/* STATUS + ERRORS */}
      <div className="status-error-wrapper space-y-4">
        <div className="status-section">
          <Typography className="section-title mb-2 font-semibold">Status Codes</Typography>
          <div className="status-pills flex flex-wrap gap-2">
            {statusData.map((s) => (
              <div key={s.id} className="status-pill error flex items-center gap-1 rounded bg-red-100 px-3 py-1 text-sm text-red-700">
                <AlertTriangle size={14} />
                {s.label} — {s.value}
              </div>
            ))}
          </div>
        </div>

        <div className="error-section">
          <Typography className="section-title mb-2 font-semibold">Errors</Typography>
          {result.errors?.length ? (
            result.errors.map((e, i) => (
              <div key={i} className="error-alert mb-2 flex items-center gap-2 rounded bg-red-50 p-3 text-red-700">
                <AlertCircle size={16} />
                {e}
              </div>
            ))
          ) : (
            <div className="success-alert flex items-center gap-2 rounded bg-green-50 p-3 text-green-700">
              <CheckCircle size={16} />
              No Errors Detected
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiSummaryView;
