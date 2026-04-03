import React, { useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";

const highlight = (line) => {
  return line
    .replace(/"(.*?)"/g, '<span class="hl-string">"$1"</span>')
    .replace(
      /\b(ENCRYPTED|TOKEN|KEY|SECRET)\b/g,
      '<span class="hl-key">$1</span>'
    );
};

const CodeViewer = ({ finding }) => {
  const [copied, setCopied] = useState(false);

  const lines = useMemo(() => {
    if (!finding?.code_snippet) return [];
    return finding.code_snippet.split("\n");
  }, [finding]);

  if (!finding) {
    return (
      <Box className="opengrep-code-viewer empty">
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <rect
              x="4"
              y="4"
              width="16"
              height="16"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M8 9h8M8 13h5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          <Typography>
            Select a finding to inspect the vulnerable code
          </Typography>
        </div>
      </Box>
    );
  }

  const start = finding.line_start;
  const end = finding.line_end;

  return (
    <Box className="opengrep-code-viewer">
      <Box className="opengrep-code-header">
        <Box className="header-left">
          <Typography className="file">{finding.file_path}</Typography>
          <Typography className="meta">
            Lines {start}–{end} · {finding.rule_id} · {finding.severity}
          </Typography>
        </Box>

        <button
          className={`copy-btn ${copied ? "copied" : ""}`}
          title={copied ? "Copied" : "Copy code"}
          onClick={() => {
            navigator.clipboard.writeText(finding.code_snippet);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
            >
              <rect
                x="9"
                y="9"
                width="13"
                height="13"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
              <rect
                x="3"
                y="3"
                width="13"
                height="13"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          )}
        </button>
      </Box>

      <div className="opengrep-code-block">
        {lines.map((line, idx) => {
          const lineNo = start + idx;
          const isVulnerable = lineNo >= start && lineNo <= end;

          return (
            <div
              key={idx}
              className={`code-line ${
                isVulnerable ? "vulnerable" : ""
              }`}
            >
              <span className="line-number">{lineNo}</span>
              <span
                className="line-content"
                dangerouslySetInnerHTML={{
                  __html: highlight(line) || " ",
                }}
              />
            </div>
          );
        })}
      </div>
    </Box>
  );
};

export default CodeViewer;
