import { Paper, Typography, Box, Grid, CircularProgress, Tooltip } from "@mui/material";
import {
  bottomMetricsConfig,
  reportInfoConfig,
  reportMetricsConfig,
} from "../../../services/ReportListService";
import IssuesSeverityChart from "./IssuesSeverityChart.js";

const valueMap = {
  A: 0,
  B: 2,
  C: 5,
  D: 1,
  E: 3,
};

const metricFilterMap = {
  reliabilityRating: "BUG",
  securityRating: "VULNERABILITY",
  maintainabilityRating: "CODE_SMELL",
  bugs: "BUG",
  vulnerabilities: "VULNERABILITY",
  codeSmells: "CODE_SMELL",
};


const SummaryView = ({ reportDetails, onMetricClick, onLinesOfCodeClick }) => {
  const categoryByRatingKey = {
    reliabilityRating: "Reliability",
    securityRating: "Security",
    maintainabilityRating: "Maintainability",
  };

  const ratingDescriptions = {
    Security: {
      A: "Security rating A: no issues above Info severity impacting security.",
      B: "Security rating B: at least one Low-impact security issue is present.",
      C: "Security rating C: at least one Medium-impact security issue is present.",
      D: "Security rating D: at least one High-impact security issue is present.",
      E: "Security rating E: at least one Critical-impact security issue is present.",
    },
    Reliability: {
      A: "Reliability rating A: no issues above Info severity affecting reliability.",
      B: "Reliability rating B: at least one Low-impact reliability issue is present.",
      C: "Reliability rating C: at least one Medium-impact reliability issue is present.",
      D: "Reliability rating D: at least one High-impact reliability issue is present.",
      E: "Reliability rating E: at least one Critical-impact reliability issue is present.",
    },
    Maintainability: {
      A: "Maintainability rating A: no issues above Info severity affecting maintainability.",
      B: "Maintainability rating B: at least one Low-impact maintainability issue is present.",
      C: "Maintainability rating C: at least one Medium-impact maintainability issue is present.",
      D: "Maintainability rating D: at least one High-impact maintainability issue is present.",
      E: "Maintainability rating E: at least one Critical-impact maintainability issue is present.",
    },
  };

  const getTooltip = (ratingKey, letter) => {
    const category = categoryByRatingKey[ratingKey] || "";
    const map = ratingDescriptions[category] || {};
    return map[letter] || `${category} rating ${letter}`;
  };

  const getValueTooltip = (ratingKey) => {
    const category = categoryByRatingKey[ratingKey] || "";
    const prefix = category.charAt(0); // R/S/M
    const msg =
      "Issues in code can impact multiple Software Qualities, so the sum of impacts tends to be greater than the total amount of issues.";
    return `${category ? category + ':' : ''} ${msg}`;
  };

  return (
    <Paper className="report-dashboard-wrapper" elevation={2}>
      <div className="report-dashboard-header">
        <div className="report-title-block">
          <img
            src="./cloudlogo.jpeg"
            alt="CloudsAnalytics Logo"
            className="dashboard-logo"
          />
          <Typography variant="h5" className="header-title">
            CloudsAnalytics
          </Typography>
        </div>
        <Typography variant="h5" className="overview-label">
          Overview Report
        </Typography>
      </div>

      <Grid
        container
        spacing={2}
        wrap="wrap"
        className="dashboard-grid-section"
      >
        {reportInfoConfig.map((item, idx) => {
          if (item.spacer) {
            return (
              <Grid key={idx} size={{ xs: 6, sm: 3 }}>
                <Box />
              </Grid>
            );
          }

          const value = reportDetails?.[item.key] || "—";

          return (
            <Grid key={idx} size={{ xs: 6, sm: 3 }}>
              <Paper className="info-card">
                <Typography className="info-label">{item.label}</Typography>
                {item.key === "linesOfCode" ? (
                  <Typography
                    className="info-value clickable-metric"
                    onClick={() => onLinesOfCodeClick && onLinesOfCodeClick()}
                  >
                    {value}
                  </Typography>
                ) : (
                  <Typography className="info-value">{value}</Typography>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Grid
        container
        spacing={2}
        wrap="wrap"
        className="report-metrics-section"
      >
        {reportMetricsConfig.map((card, idx) => {
          const value = reportDetails?.[card.key] || "—";
          const rating = reportDetails?.[card.ratingKey] ?? "";

          const handleClick = () => {
            const filterType = metricFilterMap[card.key] || null;
            if (filterType && onMetricClick) {
              onMetricClick(filterType);
            }
          };

          return (
            <Grid key={idx} size={{ xs: 12, md: 4 }}>
              <Paper className="metric-card">
                <Typography variant="h6" className="metric-title">
                  {card.title}
                </Typography>

                {card.ratingKey && (
                  <Tooltip
                    title={getTooltip(card.ratingKey, rating)}
                    placement="top"
                    arrow
                    enterDelay={300}
                    slotProps={{
                      tooltip: {
                        sx: {
                          maxWidth: 520,
                          fontSize: '0.75rem',
                          lineHeight: 1.5,
                          p: 1.25,
                        },
                      },
                      arrow: {
                        sx: { color: '#111827' },
                      },
                    }}
                  >
                    <div className={`rating-badge rating-${rating}`} aria-label={`${categoryByRatingKey[card.ratingKey]} rating ${rating}`}>
                      <span className="rating-text">{rating}</span>
                    </div>
                  </Tooltip>
                )}

                <Typography variant="body1" className="metric-label">
                  {card.metricLabel}
                </Typography>
                {card.ratingKey ? (
                  <Tooltip
                    title={getValueTooltip(card.ratingKey)}
                    placement="top"
                    arrow
                    enterDelay={300}
                    slotProps={{
                      tooltip: {
                        sx: {
                          maxWidth: 520,
                          fontSize: '0.75rem',
                          lineHeight: 1.5,
                          p: 1.25,
                        },
                      },
                      arrow: {
                        sx: { color: '#111827' },
                      },
                    }}
                  >
                    <Typography
                      variant="h3"
                      className="metric-value clickable-metric"
                      onClick={handleClick}
                    >
                      {value}
                    </Typography>
                  </Tooltip>
                ) : (
                  <Typography
                    variant="h3"
                    className="metric-value clickable-metric"
                    onClick={handleClick}
                  >
                    {value}
                  </Typography>
                )}

                <div className="metric-icon">{card.icon}</div>

                {/* <div className="rating-level-list">
                  {["A", "B", "C", "D", "E"].map((level) => {
                    const value = valueMap[level] || 0;
                    const percentage = Math.min((value / 5) * 100, 100);

                    return (
                      <div key={level} className="rating-row">
                        <div className={`rating-level rating-${level}`}>
                          {level}
                        </div>

                        <div className="rating-bar-container">
                          <div
                            className={`rating-bar rating-${level}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        <div className="rating-count">{value}</div>
                      </div>
                    );
                  })}
                </div> */}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={2} wrap="wrap" className="report-bottom-section">
        {bottomMetricsConfig.map((item, idx) => {
          const value =
            item.metricKey && reportDetails?.[item.metricKey] !== undefined
              ? parseFloat(reportDetails[item.metricKey])
              : null;

          return (
            <Grid key={idx} size={{ xs: 12, md: 4 }}>
              <Paper className="metric-card">
                <Typography variant="h6" className="metric-title">
                  {item.title}
                </Typography>

                {item.key === "issuesBySeverity" ? (
                  <IssuesSeverityChart
                    data={reportDetails?.issuesBySeverity}
                    onIssueCountClick={(type, severity) =>
                      onMetricClick && onMetricClick({ type, severity })
                    }
                  />
                ) : value != null ? (
                  <div className="metric-progress-wrapper">
                    <CircularProgress
                      variant="determinate"
                      value={100}
                      className="metric-progress-bg"
                    />
                    <CircularProgress
                      variant="determinate"
                      value={value}
                      className="metric-progress-fg"
                    />
                    <Typography
                      variant="h3"
                      className="metric-progress-label metric-value"
                    >
                      {value.toFixed(1)}%
                    </Typography>
                  </div>
                ) : (
                  <Typography variant="h3" className="metric-value">
                    —
                  </Typography>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
};

export default SummaryView;
