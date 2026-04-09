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

const SEVERITY_CLASS = {
  CRITICAL: "border-rose-200 bg-rose-50 text-rose-700",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

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
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
      <Box className="space-y-4 p-4">
        <Box className="flex items-start gap-2">
          <Typography className="flex-1 text-sm font-semibold text-slate-900">
            {finding.rule_id}
          </Typography>

          <IconButton className="rounded p-1 hover:bg-slate-100" onClick={onClose} title="Close">
            <X className="h-4 w-4" />
          </IconButton>

          <Chip
            label={finding.severity}
            className={SEVERITY_CLASS[finding.severity?.toUpperCase?.()] || "border-slate-200 bg-slate-50 text-slate-700"}
          />
        </Box>

        <Divider className="h-px bg-slate-200" />

        <Box className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <LabelOutlinedIcon className="h-4 w-4 text-slate-500" />
            <span className="text-slate-500">Category</span>
            <span className="font-medium text-slate-800">{finding.category || "-"}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-700">
            <FolderOutlinedIcon className="h-4 w-4 text-slate-500" />
            <span className="text-slate-500">File</span>
            <span className="truncate font-mono text-xs text-slate-800">{finding.file_path || "-"}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-700">
            <NumbersOutlinedIcon className="h-4 w-4 text-slate-500" />
            <span className="text-slate-500">Line</span>
            <span className="font-medium text-slate-800">{finding.line_start ?? "-"}</span>
          </div>

          {finding.cwe && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <CodeOutlinedIcon className="h-4 w-4 text-slate-500" />
              <span className="text-slate-500">CWE</span>
              <span className="font-medium text-slate-800">{finding.cwe}</span>
            </div>
          )}
        </Box>

        <Box className="space-y-2">
          <Box className="flex items-center justify-between">
            <Typography className="text-sm font-semibold text-slate-900">
              Code Snippet
            </Typography>

            <Tooltip title={copied ? "Copied" : "Copy"}>
              <IconButton
                onClick={handleCopy}
                className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50"
              >
                {copied ? <CheckIcon className="h-4 w-4" /> : <ContentCopyIcon className="h-4 w-4" />}
              </IconButton>
            </Tooltip>
          </Box>

          <pre className="max-h-[48vh] overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-3 font-mono text-xs leading-6 text-slate-100">
{finding.code_snippet || "No code snippet available"}
          </pre>
        </Box>
      </Box>
      </div>
    </div>
  );
};

export default FindingDetails;
