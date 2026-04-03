import React, { useState } from "react";
import {
  Drawer,
  Typography,
  Divider,
  Box,
  Chip,
  IconButton,
  Tooltip
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import CodeOutlinedIcon from "@mui/icons-material/CodeOutlined";
import NumbersOutlinedIcon from "@mui/icons-material/NumbersOutlined";

const FindingDetails = ({ finding, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!finding) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(finding.code_snippet || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      PaperProps={{ className: "finding-drawer" }}
    >
      <Box className="finding-details">
        <Box className="finding-header">
          <Typography className="finding-title">
            {finding.rule_id}
          </Typography>

          <Chip
            label={finding.severity}
            size="small"
            className={`severity-chip ${finding.severity.toLowerCase()}`}
          />
        </Box>

        <Divider />

        <Box className="details-section">
          <div className="detail-row">
            <LabelOutlinedIcon />
            <span className="label">Category</span>
            <span className="value">{finding.category}</span>
          </div>

          <div className="detail-row">
            <FolderOutlinedIcon />
            <span className="label">File</span>
            <span className="value mono">{finding.file_path}</span>
          </div>

          <div className="detail-row">
            <NumbersOutlinedIcon />
            <span className="label">Line</span>
            <span className="value">{finding.line_start}</span>
          </div>

          {finding.cwe && (
            <div className="detail-row">
              <CodeOutlinedIcon />
              <span className="label">CWE</span>
              <span className="value">{finding.cwe}</span>
            </div>
          )}
        </Box>

        <Box className="code-section">
          <Box className="code-header">
            <Typography className="detail-subtitle">
              Code Snippet
            </Typography>

            <Tooltip title={copied ? "Copied" : "Copy"}>
              <IconButton
                size="small"
                onClick={handleCopy}
                className="copy-btn"
              >
                {copied ? <CheckIcon /> : <ContentCopyIcon />}
              </IconButton>
            </Tooltip>
          </Box>

          <pre className="code-snippet">
{finding.code_snippet || "No code snippet available"}
          </pre>
        </Box>
      </Box>
    </Drawer>
  );
};

export default FindingDetails;
