import React from "react";
import { Box, Typography } from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import TimerIcon from "@mui/icons-material/Timer";
import BuildIcon from "@mui/icons-material/Build";

const ScanMetadata = ({ metadata }) => {
  if (!metadata) return null;

  return (
    <Box className="scan-metadata-panel">
      <Typography className="panel-title">
        Scan Info
      </Typography>

      <Box className="scan-meta-row">
        <LinkIcon fontSize="small" />
        <Typography className="scan-meta-value">
          {metadata.repo?.url}
        </Typography>
      </Box>

      <Box className="scan-meta-row">
        <AccountTreeIcon fontSize="small" />
        <Typography className="scan-meta-value">
          Branch: {metadata.branch}
        </Typography>
      </Box>

      <Box className="scan-meta-row">
        <TimerIcon fontSize="small" />
        <Typography className="scan-meta-value">
          Duration: {metadata.duration_seconds}s
        </Typography>
      </Box>

      <Box className="scan-meta-row">
        <BuildIcon fontSize="small" />
        <Typography className="scan-meta-value">
          Tool: {metadata.tool}
        </Typography>
      </Box>
    </Box>
  );
};

export default ScanMetadata;
