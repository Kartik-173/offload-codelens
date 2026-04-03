import React from "react";
import {
  Box,
  Typography,
  LinearProgress
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import { CWE_LABELS } from "../../../../../utils/Helpers";

const CWESummary = ({ cwe }) => {
  if (!cwe || Object.keys(cwe).length === 0) {
    return (
      <Box className="cwe-panel">
        <Typography className="panel-title">
          <SecurityIcon fontSize="small" />
          CWE Summary
        </Typography>
        <Typography className="cwe-empty">
          No CWE data available
        </Typography>
      </Box>
    );
  }

  const entries = Object.entries(cwe)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  const max = Math.max(...entries.map(([, v]) => v));

  return (
    <Box className="cwe-panel">
      <Typography className="panel-title">
        <SecurityIcon fontSize="small" />
        Top CWEs
      </Typography>

      <Box className="cwe-scroll">
        <Box className="cwe-list">
          {entries.map(([id, count]) => (
            <Box key={id} className="cwe-item">
              <Box className="cwe-header">
                <Typography className="cwe-id">{id}</Typography>
                <Typography className="cwe-count">{count}</Typography>
              </Box>

              <Typography className="cwe-name">
                {CWE_LABELS[id] || "Security Weakness"}
              </Typography>

              <LinearProgress
                variant="determinate"
                value={(count / max) * 100}
                className="cwe-bar"
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default CWESummary;
