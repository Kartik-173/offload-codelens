import React, { useState } from "react";
import {
  Copy as ContentCopyIcon,
  Check as CheckIcon,
  Folder as FolderOutlinedIcon,
  Tag as LabelOutlinedIcon,
  Code as CodeOutlinedIcon,
  Hash as NumbersOutlinedIcon,
  X,
} from "lucide-react";

const Box = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const Typography = ({ children, className = "" }) => (
  <p className={className}>{children}</p>
);

const Divider = ({ className = "" }) => <div className={className} />;

const Chip = ({ label, className = "" }) => (
  <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${className}`.trim()}>{label}</span>
);

const IconButton = ({ children, onClick, className = "", title }) => (
  <button type="button" onClick={onClick} className={className} title={title}>
    {children}
  </button>
);

const Tooltip = ({ children, title }) => (
  <span title={typeof title === "string" ? title : undefined}>{children}</span>
);

const FindingDetails = ({ finding, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!finding) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(finding.code_snippet || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/20" onClick={onClose}>
      <div className="finding-drawer h-full w-full max-w-xl overflow-y-auto bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
      <Box className="finding-details">
        <Box className="finding-header">
          <Typography className="finding-title">
            {finding.rule_id}
          </Typography>

          <IconButton className="rounded p-1 hover:bg-slate-100" onClick={onClose} title="Close">
            <X className="h-4 w-4" />
          </IconButton>

          <Chip
            label={finding.severity}
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
                onClick={handleCopy}
                className="copy-btn"
              >
                {copied ? <CheckIcon className="h-4 w-4" /> : <ContentCopyIcon className="h-4 w-4" />}
              </IconButton>
            </Tooltip>
          </Box>

          <pre className="code-snippet">
{finding.code_snippet || "No code snippet available"}
          </pre>
        </Box>
      </Box>
      </div>
    </div>
  );
};

export default FindingDetails;
