import { reportMetricsConfig } from "../../../services/ReportListService";

const IssuesSeverityChart = ({ data, onIssueCountClick }) => {
  // Build header labels and icons arrays
  const headerLabels = reportMetricsConfig.map((m) => {
    const labelMap = {
      bugs: "Bug",
      vulnerabilities: "Vulnerability",
      codeSmells: "Code Smell",
    };
    return labelMap[m.key] || m.metricLabel;
  });

  const headerIcons = reportMetricsConfig.map((m) => m.icon);

  const categoryTypeKeys = ["BUG", "VULNERABILITY", "CODE_SMELL"];

  const severities = [
    { label: "", colorClass: "sev-header", counts: headerIcons },
    { label: "Blocker", colorClass: "sev-blocker", counts: data?.BLOCKER || [0, 0, 0] },
    { label: "Critical", colorClass: "sev-critical", counts: data?.CRITICAL || [0, 0, 0] },
    { label: "Major", colorClass: "sev-major", counts: data?.MAJOR || [0, 0, 0] },
    { label: "Minor", colorClass: "sev-minor", counts: data?.MINOR || [0, 0, 0] },
    { label: "Info", colorClass: "sev-info", counts: data?.INFO || [0, 0, 0] },
  ];

  return (
    <div className="severity-chart">
      {severities.map((sev, rowIdx) => {
        if (sev.colorClass === "sev-header") {
          return (
            <>
              <div
                key={`hdr-icons-${rowIdx}`}
                className={`severity-row ${sev.colorClass} header-icons`}
              >
                {sev.counts.map((item, idx) => (
                  <span
                    key={idx}
                    className={typeof item === "number" ? "severity-count" : "metric-icon severity-count"}
                  >
                    {typeof item === "number" ? item.toLocaleString() : item}
                  </span>
                ))}
              </div>
              <div
                key={`hdr-labels-${rowIdx}`}
                className={`severity-row ${sev.colorClass} header-labels`}
              >
                {reportMetricsConfig.map((metric, idx) => (
                  <span
                    key={idx}
                    className="severity-header-text"
                  >
                    {metric.metricLabel}
                  </span>
                ))}
              </div>
            </>
          );
        }

        return (
          <div key={rowIdx} className={`severity-row ${sev.colorClass}`}>
            {sev.counts.map((item, idx) => {
              if (typeof item === 'number') {
                const typeKey = categoryTypeKeys[idx];
                const tooltipTitle = `${sev.label} ${headerLabels[idx]}`;
                const handleClick = () => {
                  if (onIssueCountClick && typeKey) {
                    onIssueCountClick(typeKey, sev.label.toUpperCase());
                  }
                };
                return (
                  <span key={idx} title={tooltipTitle}>
                    <span className="severity-count clickable" onClick={handleClick}>
                      {item.toLocaleString()}
                    </span>
                  </span>
                );
              }
              return (
                <span key={idx} className="metric-icon severity-count">
                  {item}
                </span>
              );
            })}
          </div>
        );
      })}

      <div className="severity-legend">
        <div className="legend-item">
          <span className="legend-dot sev-blocker"></span> Blocker
        </div>
        <div className="legend-item">
          <span className="legend-dot sev-critical"></span> Critical
        </div>
        <div className="legend-item">
          <span className="legend-dot sev-major"></span> Major
        </div>
        <div className="legend-item">
          <span className="legend-dot sev-minor"></span> Minor
        </div>
        <div className="legend-item">
          <span className="legend-dot sev-info"></span> Info
        </div>
      </div>
    </div>
  );
};


export default IssuesSeverityChart;
