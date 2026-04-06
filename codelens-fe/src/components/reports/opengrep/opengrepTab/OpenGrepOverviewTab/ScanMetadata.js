import React from "react";
import {
  Link2 as LinkIcon,
  Waypoints as AccountTreeIcon,
  Timer as TimerIcon,
  Wrench as BuildIcon,
} from "lucide-react";

const Box = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const Typography = ({ children, className = "" }) => (
  <p className={className}>{children}</p>
);

const ScanMetadata = ({ metadata }) => {
  if (!metadata) return null;

  return (
    <Box className="scan-metadata-panel">
      <Typography className="panel-title">
        Scan Info
      </Typography>

      <Box className="scan-meta-row">
        <LinkIcon className="h-4 w-4" />
        <Typography className="scan-meta-value">
          {metadata.repo?.url}
        </Typography>
      </Box>

      <Box className="scan-meta-row">
        <AccountTreeIcon className="h-4 w-4" />
        <Typography className="scan-meta-value">
          Branch: {metadata.branch}
        </Typography>
      </Box>

      <Box className="scan-meta-row">
        <TimerIcon className="h-4 w-4" />
        <Typography className="scan-meta-value">
          Duration: {metadata.duration_seconds}s
        </Typography>
      </Box>

      <Box className="scan-meta-row">
        <BuildIcon className="h-4 w-4" />
        <Typography className="scan-meta-value">
          Tool: {metadata.tool}
        </Typography>
      </Box>
    </Box>
  );
};

export default ScanMetadata;
