import React from "react";
import { Box, Typography } from "@mui/material";

const InfoItem = ({ icon, label, value, isLink }) => (
  <Box className="scan-info-item">
    <Box className="scan-info-icon-box">{icon}</Box>

    <Box className="scan-info-text">
      <Typography className="scan-info-label">
        {label}
      </Typography>

      {isLink ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="scan-info-value link"
        >
          {value}
        </a>
      ) : (
        <Typography className="scan-info-value">
          {value}
        </Typography>
      )}
    </Box>
  </Box>
);

const OpenGrepScanInfoTab = ({ scanMetadata, scanStatus }) => {
  if (!scanMetadata) {
    return (
      <Box className="scan-info scan-info-empty">
        <Typography>No scan information available</Typography>
      </Box>
    );
  }

  return (
    <Box className="scan-info">
      <Box className="scan-info-header">
        <Typography className="scan-info-title">
          Scan Information
        </Typography>

        {scanStatus && (
          <span
            className={`scan-status-badge ${scanStatus.state.toLowerCase()}`}
          >
            {scanStatus.state}
          </span>
        )}
      </Box>

      <Box className="scan-info-card">
        <Box className="scan-info-grid">
          <InfoItem
            icon="🔗"
            label="Repository"
            value={scanMetadata.repo?.url}
            isLink
          />

          <InfoItem
            icon="🌿"
            label="Branch"
            value={scanMetadata.branch}
          />

          <InfoItem
            icon="⏱"
            label="Scan Duration"
            value={`${scanMetadata.duration_seconds}s`}
          />

          <InfoItem
            icon="🛠"
            label="Tool"
            value={`${scanMetadata.tool} ${scanMetadata.tool_version}`}
          />

          <InfoItem
            icon="🆔"
            label="Scan ID"
            value={scanMetadata.scan_id}
          />

          <InfoItem
            icon="📅"
            label="Scan Time"
            value={new Date(scanMetadata.scan_time).toLocaleString()}
          />

          <InfoItem
            icon="📦"
            label="Triggered By"
            value={scanMetadata.triggered_by}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default OpenGrepScanInfoTab;
