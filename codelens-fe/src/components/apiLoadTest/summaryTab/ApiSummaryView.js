import React from "react";
import {
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

const STATUS_COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#0ea5e9", "#8b5cf6", "#64748b"];

const getStatusMeta = (code) => {
  const numeric = Number(code);

  if (!Number.isFinite(numeric) || numeric === 0) {
    return {
      category: "Transport",
      description: "Network/connection",
      tone: "border-slate-200 bg-slate-50 text-slate-700",
      iconTone: "text-slate-500",
    };
  }

  if (numeric >= 200 && numeric < 300) {
    return {
      category: "Success",
      description: "2xx",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
      iconTone: "text-emerald-600",
    };
  }

  if (numeric >= 300 && numeric < 400) {
    return {
      category: "Redirect",
      description: "3xx",
      tone: "border-sky-200 bg-sky-50 text-sky-700",
      iconTone: "text-sky-600",
    };
  }

  if (numeric >= 400 && numeric < 500) {
    return {
      category: "Client Error",
      description: "4xx",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
      iconTone: "text-amber-600",
    };
  }

  if (numeric >= 500) {
    return {
      category: "Server Error",
      description: "5xx",
      tone: "border-rose-200 bg-rose-50 text-rose-700",
      iconTone: "text-rose-600",
    };
  }

  return {
    category: "Other",
    description: "Unknown",
    tone: "border-slate-200 bg-slate-50 text-slate-700",
    iconTone: "text-slate-500",
  };
};

const StatusDonut = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!total) {
    return <Typography className="text-sm text-slate-500">No status code data available.</Typography>;
  }

  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[180px_minmax(0,1fr)] md:items-center">
      <div className="mx-auto h-[180px] w-[180px]">
        <svg viewBox="0 0 120 120" className="h-full w-full">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="14" />
          {data.map((item, idx) => {
            const length = (item.value / total) * circumference;
            const offset = data
              .slice(0, idx)
              .reduce((sum, s) => sum + (s.value / total) * circumference, 0);

            return (
              <circle
                key={item.id}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth="14"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 60 60)"
              />
            );
          })}
          <text x="60" y="56" textAnchor="middle" className="fill-slate-500 text-[8px] font-medium uppercase">
            Total
          </text>
          <text x="60" y="68" textAnchor="middle" className="fill-slate-900 text-[11px] font-semibold">
            {total}
          </text>
        </svg>
      </div>

      <div className="space-y-2">
        {data.map((item) => {
          const pct = total ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={item.id} className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-2.5 py-2 text-sm">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="font-medium text-slate-700">{item.label}</span>
              </span>
              <span className="text-slate-600">{item.value} ({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

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

  const statusData = Object.entries(result.status_codes || {})
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([code, count], index) => ({
      id: code,
      label: code,
      value: count,
      color: STATUS_COLORS[index % STATUS_COLORS.length],
      ...getStatusMeta(code),
    }));
  const totalStatusCount = statusData.reduce((sum, item) => sum + item.value, 0);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary.url);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-sky-200 bg-sky-100 text-sky-700">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <Typography className="text-base font-semibold text-slate-900">Load Test Summary</Typography>
              <Typography className="mt-0.5 text-sm text-slate-500">Method: {summary.method}</Typography>
            </div>
          </div>

          <div className="flex max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <Typography className="truncate text-sm text-slate-600" title={summary.url}>{summary.url}</Typography>
            <button
              className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              onClick={handleCopy}
              title="Copy URL"
            >
              <Copy size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Requested Rate", value: `${summary.requestedRate}/sec`, icon: <Gauge size={18} /> },
          { label: "Requests Sent", value: summary.requests, icon: <Zap size={18} /> },
          { label: "Success Ratio", value: `${(summary.successRatio * 100).toFixed(2)}%`, icon: <Activity size={18} /> },
          { label: "Avg Latency", value: `${summary.avgLatencyMs.toFixed(2)} ms`, icon: <Clock size={18} /> },
          { label: "P95 Latency", value: `${summary.p95LatencyMs.toFixed(2)} ms`, icon: <Clock size={18} /> },
          { label: "Max Latency", value: `${summary.maxLatencyMs.toFixed(2)} ms`, icon: <Clock size={18} /> },
        ].map((m) => (
          <Paper key={m.label} className="border-slate-200">
            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-700">
              {m.icon}
            </div>
            <Typography className="text-lg font-semibold text-slate-900">{m.value}</Typography>
            <Typography className="mt-0.5 text-sm text-slate-500">{m.label}</Typography>
          </Paper>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Paper className="border-slate-200">
          <div className="mb-4 flex items-center gap-2 text-slate-800">
            <BarChart2 size={18} />
            <Typography className="text-sm font-semibold">Latency Percentiles (ms)</Typography>
          </div>
          <SimpleBarChart data={latencyBars} />
        </Paper>

        <Paper className="border-slate-200">
          <div className="mb-4 flex items-center gap-2 text-slate-800">
            <Donut size={18} />
            <Typography className="text-sm font-semibold">Status Code Distribution</Typography>
          </div>
          {statusData.length ? (
            <StatusDonut data={statusData} />
          ) : (
            <Typography className="text-sm text-slate-500">No status code data available.</Typography>
          )}
        </Paper>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Paper className="border-slate-200">
          <Typography className="mb-2 text-sm font-semibold text-slate-900">Status Codes</Typography>
          {statusData.length ? (
            <div className="space-y-2">
              {statusData.map((s) => {
                const percent = totalStatusCount ? ((s.value / totalStatusCount) * 100).toFixed(2) : "0.00";
                return (
                  <div key={s.id} className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${s.tone}`}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className={s.iconTone} />
                      <span className="font-medium">HTTP {s.label}</span>
                      <span className="rounded-md border border-current/20 bg-white/70 px-1.5 py-0.5 text-[11px]">{s.category}</span>
                      <span className="text-xs opacity-80">{s.description}</span>
                    </div>
                    <span className="text-xs font-medium">{s.value} requests ({percent}%)</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <Typography className="text-sm text-slate-500">No status code data available.</Typography>
          )}
        </Paper>

        <Paper className="border-slate-200">
          <Typography className="mb-2 text-sm font-semibold text-slate-900">Errors</Typography>
          {result.errors?.length ? (
            <div className="space-y-2">
              {result.errors.map((e, i) => (
                <div key={i} className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{e}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              <CheckCircle size={16} />
              No errors detected
            </div>
          )}
        </Paper>
      </div>
    </div>
  );
};

export default ApiSummaryView;
