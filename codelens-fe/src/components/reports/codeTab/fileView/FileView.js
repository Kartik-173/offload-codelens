import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Snackbar,
  Alert,
  Paper,
  CircularProgress,
} from "@mui/material";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import MetricCard from "./MetricCard.js";
import MetricMenu from "./MetricMenu.js";

const FileView = ({ currentFile, fileContent }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  if (!currentFile || !fileContent) {
    return <Box className="repo-list-loading">
      <CircularProgress />
    </Box>;
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
            variant="subtitle2"
            color="textSecondary"
            noWrap
            className="file-view-path"
          >
            {displayPath}
          </Typography>
          <ContentCopyIcon
            fontSize="small"
            onClick={handleCopyPath}
            className="file-view-copy-icon"
          />
        </Box>

        {/* Metrics */}
        <Box className="file-view-metrics-wrapper">
          {/* Group 1 */}
          <Grid container spacing={1} wrap="nowrap" className="file-view-metrics-grid">
            {[
              { label: "Lines", value: fileContent.metrics?.lines ?? "-" },
              { label: "Coverage", value: fileContent.metrics?.coverage != null ? `${fileContent.metrics.coverage}%` : "-" },
              { label: "Duplications", value: fileContent.metrics?.duplications != null ? `${fileContent.metrics.duplications}%` : "-" },
            ].map((m, idx) => (
              <Grid key={idx}>
                <MetricCard label={m.label} value={m.value} />
              </Grid>
            ))}
          </Grid>

          <Box className="file-view-metrics-divider" />

          {/* Group 2 */}
          <Grid container spacing={1} wrap="nowrap" className="file-view-metrics-grid clickable">
            {[
              { label: "Security", value: fileContent.metrics?.security ?? "-" },
              { label: "Reliability", value: fileContent.metrics?.reliability ?? "-" },
              { label: "Maintainability", value: fileContent.metrics?.maintainability ?? "-" },
              { label: "Security Hotspot", value: fileContent.metrics?.securityHotspots ?? "-" },
            ].map((m, idx) => (
              <Grid key={idx}>
                <MetricCard label={m.label} value={m.value}>
                </MetricCard>
              </Grid>
            ))}
          </Grid>
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
                  variant="body2"
                  component="pre"
                  className="file-view-code-text"
                  dangerouslySetInnerHTML={{ __html: src.code }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ fontSize: "0.85rem" }}>
          Copied to clipboard!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FileView;
