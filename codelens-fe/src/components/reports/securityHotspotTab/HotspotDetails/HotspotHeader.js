import React from "react";
import { Box, Typography, Button } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const HotspotHeader = ({ hotspot, handleCopyPath, getPriorityIcon }) => {
  return (
    <Box className="hotspot-header">
      <Box className="hotspot-summary-text">
        <Typography variant="h6" className="hotspot-summary-title">
          {hotspot.message}
          <ContentCopyIcon
            fontSize="small"
            onClick={handleCopyPath}
            className="file-view-copy-icon"
          />
        </Typography>

        <Typography variant="body2" className="hotspot-summary-subtitle">
          {hotspot.rule.name} {hotspot.rule.key}
        </Typography>

        <Box className="hotspot-summary-status">
          <Box className="hotspot-summary-text-box">
            <Typography className="hotspot-status-text">
              Status: {hotspot.status}
            </Typography>
            <Typography className="hotspot-status-desc">
              This security hotspot needs to be reviewed to assess whether the
              code poses a risk.
            </Typography>
          </Box>

          <Button variant="contained" className="review-btn">
            Review
          </Button>
        </Box>
      </Box>

      <Box className="hotspot-summary-meta">
        <Box className="meta-item">
          <Typography className="meta-label">Review priority:</Typography>
          <Typography className="meta-value">
            {getPriorityIcon(hotspot.rule.vulnerabilityProbability)}
            {hotspot.rule.vulnerabilityProbability}
          </Typography>
        </Box>

        <Box className="meta-item">
          <Typography className="meta-label">Category:</Typography>
          <Typography className="meta-value">
            {hotspot.rule.securityCategory}
          </Typography>
        </Box>

        <Box className="meta-item">
          <Typography className="meta-label">Assignee:</Typography>
          <Typography className="meta-value">Not assigned</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default HotspotHeader;
