import React, { useMemo, useState } from "react";
import Editor from "@monaco-editor/react";

const Box = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const Typography = ({ children, className = "", ...props }) => (
  <p className={className} {...props}>{children}</p>
);

const SEVERITY_CLASS = {
  CRITICAL: "border-rose-200 bg-rose-50 text-rose-700",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const CodeViewer = ({ finding }) => {
  const [copied, setCopied] = useState(false);

  const filePath = finding?.file_path || "";
  const fileName = filePath.split("/").pop() || filePath;
  const extension = fileName.includes(".") ? fileName.split(".").pop().toLowerCase() : "";

  const languageLabelMap = {
    js: "JavaScript",
    jsx: "JavaScript React",
    ts: "TypeScript",
    tsx: "TypeScript React",
    py: "Python",
    java: "Java",
    php: "PHP",
    go: "Go",
    rb: "Ruby",
    cs: "C#",
    cpp: "C++",
    c: "C",
    json: "JSON",
    yml: "YAML",
    yaml: "YAML",
    xml: "XML",
    html: "HTML",
    css: "CSS",
    scss: "SCSS",
    sh: "Shell",
  };

  const monacoLanguageMap = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    java: "java",
    php: "php",
    go: "go",
    rb: "ruby",
    cs: "csharp",
    cpp: "cpp",
    c: "c",
    json: "json",
    yml: "yaml",
    yaml: "yaml",
    xml: "xml",
    html: "html",
    css: "css",
    scss: "scss",
    sh: "shell",
  };

  const languageLabel = languageLabelMap[extension] || (extension ? extension.toUpperCase() : "Plain Text");
  const monacoLanguage = monacoLanguageMap[extension] || "plaintext";

  const sourceText = useMemo(() => finding?.code_snippet || "", [finding]);
  const sourceLines = useMemo(() => sourceText.split("\n"), [sourceText]);

  if (!finding) {
    return (
      <Box className="flex min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center">
        <div className="space-y-2 text-slate-500">
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
          <Typography className="text-sm">
            Select a finding to inspect the vulnerable code
          </Typography>
        </div>
      </Box>
    );
  }

  const start = finding.line_start;
  const end = finding.line_end;

  return (
    <Box className="overflow-hidden rounded-xl border border-[#2d2d30] bg-[#1e1e1e]">
      <Box className="flex items-center justify-between border-b border-[#2d2d30] bg-[#252526] px-3 py-2">
        <Box className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
        </Box>
        <div className="text-[11px] text-[#8c8c8c]">Read-only editor</div>
      </Box>

      <Box className="flex items-start justify-between gap-3 border-b border-[#2d2d30] bg-[#1e1e1e] px-3 py-2">
        <Box className="min-w-0 flex-1">
          <Typography className="truncate font-mono text-xs text-[#cccccc]">{finding.file_path}</Typography>
          <Typography className="mt-1 text-xs text-[#8c8c8c]">
            Lines {start}–{end} · {languageLabel} · {sourceLines.length} lines
          </Typography>
        </Box>

        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${
            SEVERITY_CLASS[finding.severity?.toUpperCase?.()] || "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          {finding.severity}
        </span>

        <button
          className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 transition hover:bg-slate-100"
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

      <div className="max-h-[68vh] overflow-hidden bg-[#1e1e1e]">
        <Editor
          height="68vh"
          theme="vs-dark"
          language={monacoLanguage}
          value={sourceText}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            lineNumbers: "on",
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            renderLineHighlight: "line",
            fontSize: 13,
            lineHeight: 24,
            fontFamily: 'Cascadia Code, Consolas, "Courier New", monospace',
            wordWrap: "off",
            glyphMargin: false,
            folding: false,
            lineDecorationsWidth: 12,
          }}
        />
      </div>
    </Box>
  );
};

export default CodeViewer;
