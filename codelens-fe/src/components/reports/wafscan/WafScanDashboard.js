import React from "react";
import {
  ChevronDown,
  ShieldAlert,
  Shield,
  Gauge,
  ChartNoAxesCombined,
  Bug,
  Globe,
} from "lucide-react";

const WafScanDashboard = ({ report }) => {
  if (!report) return null;

  const d = report.data.data;

  const kpis = [
    { label: "Protection", value: d.protectionLevel, icon: <Shield className="h-4 w-4" /> },
    { label: "Rules Score", value: d.rulesProtectionScore, icon: <ChartNoAxesCombined className="h-4 w-4" /> },
    { label: "Enabled", value: d.enabledRulesCount, icon: <Bug className="h-4 w-4" /> },
    { label: "Disabled", value: d.disabledRulesCount, icon: <Bug className="h-4 w-4" /> },
    { label: "Duration (s)", value: d.scanDurationSeconds, icon: <Gauge className="h-4 w-4" /> },
    { label: "Baseline RT", value: `${d.baselineResponseTimeMs} ms`, icon: <Gauge className="h-4 w-4" /> },
  ];

  return (
    <div className="waf-dashboard-container">
      <div className="waf-dashboard-header">
        <div className="waf-dashboard-header-left">
          <ShieldAlert className="waf-dashboard-header-icon" />
          <div>
            <p className="waf-dashboard-title text-xl font-semibold">
              WAF Scan Report
            </p>
            <p className="waf-dashboard-subtitle text-sm text-slate-600">
              {d.target}
            </p>
          </div>
        </div>

        <div className="waf-dashboard-badges">
          <span className="waf-dashboard-chip waf-dashboard-chip-success rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">WAF Detected</span>
          <span className="waf-dashboard-chip rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">Confidence: {d.confidenceLevel}</span>
          <span className="waf-dashboard-chip rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">Scan: {d.scanType}</span>
        </div>
      </div>

      <div className="waf-dashboard-meta">
        <div className="waf-dashboard-meta-item">
          <Shield className="h-4 w-4" />
          <div>
            <span className="meta-label">WAF Provider</span>
            <strong>{d.wafName}</strong>
          </div>
        </div>

        <div className="waf-dashboard-meta-item">
          <ChartNoAxesCombined className="h-4 w-4" />
          <div>
            <span className="meta-label">Detection Methods</span>
            <strong>{d.detectionMethod}</strong>
          </div>
        </div>

        <div className="waf-dashboard-meta-item">
          <Gauge className="h-4 w-4" />
          <div>
            <span className="meta-label">Scanned At</span>
            <strong>
              {new Date(d.scannedAt).toLocaleString()}
            </strong>
          </div>
        </div>
      </div>


      <div className="waf-dashboard-kpis grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {kpis.map((kpi, i) => (
          <div key={i} className="waf-dashboard-kpi rounded-md border bg-card p-4">
            <div className="waf-dashboard-kpi-header flex items-center gap-2 text-sm text-slate-600">
              {kpi.icon}
              <span>{kpi.label}</span>
            </div>
            <strong className="text-lg">{kpi.value}</strong>
          </div>
        ))}
      </div>

      <div className="waf-dashboard-panel mt-4 rounded-md border bg-card p-4">
          <p className="waf-dashboard-panel-title text-base font-semibold">
            Category Summary
          </p>
          <div className="my-2 border-t" />
          <div className="waf-dashboard-category-grid">
            {Object.entries(d.categorySummary).map(([key, value]) => (
              <div
                key={key}
                className={`waf-dashboard-category-card ${
                  value === "Blocked" ? "blocked" : "ok"
                }`}
              >
                <span className="waf-dashboard-category-key">{key}</span>
                <span className="waf-dashboard-category-value">{value}</span>
              </div>
            ))}
          </div>
      </div>

      <div className="waf-dashboard-panel mt-4 rounded-md border bg-card p-4">
          <p className="waf-dashboard-panel-title text-base font-semibold">Evidence</p>
          <div className="my-2 border-t" />
          <ul className="waf-dashboard-evidence">
            {d.evidence.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
      </div>

      <details className="waf-dashboard-accordion mt-4 rounded-md border bg-card" open>
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
          Enabled Rules
          <ChevronDown className="h-4 w-4" />
        </summary>
        <div className="px-4 pb-4">
          <div className="waf-dashboard-table">
            {d.enabledRules.map((r) => (
              <div key={r.rule_id} className="waf-dashboard-row blocked">
                <span>{r.rule_id}</span>
                <span>{r.rule_name}</span>
                <span>{r.category}</span>
                <span>{r.status}</span>
                <span>{r.responseTimeMs} ms</span>
              </div>
            ))}
          </div>
        </div>
      </details>

      <details className="waf-dashboard-accordion mt-4 rounded-md border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
          Disabled Rules
          <ChevronDown className="h-4 w-4" />
        </summary>
        <div className="px-4 pb-4">
          <div className="waf-dashboard-table">
            {d.disabledRules.map((r) => (
              <div key={r.rule_id} className="waf-dashboard-row">
                <span>{r.rule_id}</span>
                <span>{r.rule_name}</span>
                <span>{r.category}</span>
                <span>{r.status}</span>
                <span>{r.responseTimeMs} ms</span>
              </div>
            ))}
          </div>
        </div>
      </details>

      <div className="waf-dashboard-panel mt-4 rounded-md border bg-card p-4">
          <p className="waf-dashboard-panel-title text-base font-semibold">WAF Headers</p>
          <div className="my-2 border-t" />
          <div className="waf-dashboard-headers">
            {Object.entries(d.wafHeaders).map(([k, v]) => (
              <div key={k}>
                <Globe className="h-4 w-4" />
                <span>{k}</span>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
      </div>

      <div className="waf-dashboard-note mt-4 rounded-md border bg-card p-4">{d.note}</div>
    </div>
  );
};

export default WafScanDashboard;
