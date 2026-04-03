import React from "react";
import {
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SecurityIcon from "@mui/icons-material/Security";
import ShieldIcon from "@mui/icons-material/Shield";
import SpeedIcon from "@mui/icons-material/Speed";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import BugReportIcon from "@mui/icons-material/BugReport";
import HttpIcon from "@mui/icons-material/Http";

const WafScanDashboard = ({ report }) => {
  if (!report) return null;

  const d = report.data.data;

  const kpis = [
    { label: "Protection", value: d.protectionLevel, icon: <ShieldIcon /> },
    { label: "Rules Score", value: d.rulesProtectionScore, icon: <QueryStatsIcon /> },
    { label: "Enabled", value: d.enabledRulesCount, icon: <BugReportIcon /> },
    { label: "Disabled", value: d.disabledRulesCount, icon: <BugReportIcon /> },
    { label: "Duration (s)", value: d.scanDurationSeconds, icon: <SpeedIcon /> },
    { label: "Baseline RT", value: `${d.baselineResponseTimeMs} ms`, icon: <SpeedIcon /> },
  ];

  return (
    <div className="waf-dashboard-container">
      <div className="waf-dashboard-header">
        <div className="waf-dashboard-header-left">
          <SecurityIcon className="waf-dashboard-header-icon" />
          <div>
            <Typography className="waf-dashboard-title">
              WAF Scan Report
            </Typography>
            <Typography className="waf-dashboard-subtitle">
              {d.target}
            </Typography>
          </div>
        </div>

        <div className="waf-dashboard-badges">
          <Chip className="waf-dashboard-chip waf-dashboard-chip-success" label="WAF Detected" />
          <Chip className="waf-dashboard-chip" label={`Confidence: ${d.confidenceLevel}`} />
          <Chip className="waf-dashboard-chip" label={`Scan: ${d.scanType}`} />
        </div>
      </div>

      <div className="waf-dashboard-meta">
        <div className="waf-dashboard-meta-item">
          <ShieldIcon />
          <div>
            <span className="meta-label">WAF Provider</span>
            <strong>{d.wafName}</strong>
          </div>
        </div>

        <div className="waf-dashboard-meta-item">
          <QueryStatsIcon />
          <div>
            <span className="meta-label">Detection Methods</span>
            <strong>{d.detectionMethod}</strong>
          </div>
        </div>

        <div className="waf-dashboard-meta-item">
          <SpeedIcon />
          <div>
            <span className="meta-label">Scanned At</span>
            <strong>
              {new Date(d.scannedAt).toLocaleString()}
            </strong>
          </div>
        </div>
      </div>


      <Grid container spacing={2} className="waf-dashboard-kpis">
        {kpis.map((kpi, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card className="waf-dashboard-kpi">
              <CardContent>
                <div className="waf-dashboard-kpi-header">
                  {kpi.icon}
                  <span>{kpi.label}</span>
                </div>
                <strong>{kpi.value}</strong>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card className="waf-dashboard-panel">
        <CardContent>
          <Typography className="waf-dashboard-panel-title">
            Category Summary
          </Typography>
          <Divider />
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
        </CardContent>
      </Card>

      <Card className="waf-dashboard-panel">
        <CardContent>
          <Typography className="waf-dashboard-panel-title">Evidence</Typography>
          <Divider />
          <ul className="waf-dashboard-evidence">
            {d.evidence.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Accordion className="waf-dashboard-accordion" defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Enabled Rules</Typography>
        </AccordionSummary>
        <AccordionDetails>
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
        </AccordionDetails>
      </Accordion>

      <Accordion className="waf-dashboard-accordion">
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Disabled Rules</Typography>
        </AccordionSummary>
        <AccordionDetails>
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
        </AccordionDetails>
      </Accordion>

      <Card className="waf-dashboard-panel">
        <CardContent>
          <Typography className="waf-dashboard-panel-title">WAF Headers</Typography>
          <Divider />
          <div className="waf-dashboard-headers">
            {Object.entries(d.wafHeaders).map(([k, v]) => (
              <div key={k}>
                <HttpIcon />
                <span>{k}</span>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="waf-dashboard-note">
        <CardContent>{d.note}</CardContent>
      </Card>
    </div>
  );
};

export default WafScanDashboard;
