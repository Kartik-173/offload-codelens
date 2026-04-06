import React, { useState } from "react";
import { FileText as InsertDriveFileOutlinedIcon, Copy as ContentCopyIcon } from "lucide-react";

import MetricCard from "./MetricCard.js";
import MetricMenu from "./MetricMenu.js";

const Box = ({ children, className = "" }) => <div className={className}>{children}</div>;
const Typography = ({ children, className = "", component = "p", ...rest }) => {
  const Tag = component;
  return <Tag className={className} {...rest}>{children}</Tag>;
};
const Paper = ({ children, className = "" }) => <div className={className}>{children}</div>;

const FileView = ({ currentFile, fileContent }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  if (!currentFile || !fileContent) {
    return (
      <Box className="repo-list-loading flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
      </Box>
    );
  }

  const displayPath = currentFile.path || "";

  const handleCopyPath = () => {
    navigator.clipboard.writeText(displayPath);
    setSnackbarOpen(true);
  };

  return (
    <Box className="file-view-container">
      <Box className="file-view-header-row">
        {/* Path */}
        <Box className="file-view-path-wrapper">
          <InsertDriveFileOutlinedIcon className="file" />
          <Typography
            className="file-view-path"
          >
            {displayPath}
          </Typography>
          <ContentCopyIcon
            onClick={handleCopyPath}
            className="file-view-copy-icon h-4 w-4"
          />
        </Box>

        {/* Metrics */}
        <Box className="file-view-metrics-wrapper">
          {/* Group 1 */}
          <div className="file-view-metrics-grid flex flex-nowrap gap-2">
            {[
              { label: "Lines", value: fileContent.metrics?.lines ?? "-" },
              { label: "Coverage", value: fileContent.metrics?.coverage != null ? `${fileContent.metrics.coverage}%` : "-" },
              { label: "Duplications", value: fileContent.metrics?.duplications != null ? `${fileContent.metrics.duplications}%` : "-" },
            ].map((m, idx) => (
              <div key={idx}>
                <MetricCard label={m.label} value={m.value} />
              </div>
            ))}
          </div>

          <Box className="file-view-metrics-divider" />

          {/* Group 2 */}
          <div className="file-view-metrics-grid clickable flex flex-nowrap gap-2">
            {[
              { label: "Security", value: fileContent.metrics?.security ?? "-" },
              { label: "Reliability", value: fileContent.metrics?.reliability ?? "-" },
              { label: "Maintainability", value: fileContent.metrics?.maintainability ?? "-" },
              { label: "Security Hotspot", value: fileContent.metrics?.securityHotspots ?? "-" },
            ].map((m, idx) => (
              <div key={idx}>
                <MetricCard label={m.label} value={m.value}>
                </MetricCard>
              </div>
            ))}
          </div>
          <MetricMenu />
        </Box>
      </Box>

      {/* Code Viewer */}
      <Paper className="file-view-code-viewer">
        <Box className="file-view-code-content">
          {(fileContent.sources || []).map((src) => (
            <Box key={src.line} className="file-view-code-line">
              <Box className="file-view-line-number">{src.line}</Box>
              <Box className="file-view-line-content">
                <Typography
                  component="pre"
                  className="file-view-code-text"
                  dangerouslySetInnerHTML={{ __html: src.code }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      {snackbarOpen && (
        <div className="fixed right-4 top-4 z-50 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 shadow">
          Copied to clipboard!
        </div>
      )}
    </Box>
  );
};

export default FileView;
