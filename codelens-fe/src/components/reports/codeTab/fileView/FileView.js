import React, { useState } from "react";
import { FileText as InsertDriveFileOutlinedIcon, Copy as ContentCopyIcon } from "lucide-react";
import Editor from "@monaco-editor/react";

import MetricCard from "./MetricCard.js";
import MetricMenu from "./MetricMenu.js";
import { Card, CardContent } from "../../../ui/card";
import { Badge } from "../../../ui/badge";

const Box = ({ children, className = "" }) => <div className={className}>{children}</div>;
const Typography = ({ children, className = "", component = "p", ...rest }) => {
  const Tag = component;
  return <Tag className={className} {...rest}>{children}</Tag>;
};
const Paper = ({ children, className = "" }) => <div className={className}>{children}</div>;

const FileView = ({ currentFile, fileContent }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  if (!currentFile || !fileContent) {
    return (
      <Box className="repo-list-loading flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
      </Box>
    );
  }

  const displayPath = currentFile.path || "";

  const handleCopyPath = () => {
    navigator.clipboard.writeText(displayPath);
    setSnackbarOpen(true);
    setTimeout(() => setSnackbarOpen(false), 1600);
  };

  const overviewMetrics = [
    { label: "Lines", value: fileContent.metrics?.lines ?? "-" },
    {
      label: "Coverage",
      value: fileContent.metrics?.coverage != null ? `${fileContent.metrics.coverage}%` : "-",
    },
    {
      label: "Duplications",
      value: fileContent.metrics?.duplications != null ? `${fileContent.metrics.duplications}%` : "-",
    },
  ];

  const qualityMetrics = [
    { label: "Security", value: fileContent.metrics?.security ?? "-" },
    { label: "Reliability", value: fileContent.metrics?.reliability ?? "-" },
    { label: "Maintainability", value: fileContent.metrics?.maintainability ?? "-" },
    { label: "Hotspots", value: fileContent.metrics?.securityHotspots ?? "-" },
  ];

  const fileName = displayPath.split("/").pop() || displayPath;
  const extension = fileName.includes(".") ? fileName.split(".").pop().toLowerCase() : "";
  const languageMap = {
    js: "JavaScript",
    jsx: "JavaScript React",
    ts: "TypeScript",
    tsx: "TypeScript React",
    html: "HTML",
    css: "CSS",
    scss: "SCSS",
    json: "JSON",
    py: "Python",
    java: "Java",
    php: "PHP",
  };
  const languageLabel = languageMap[extension] || (extension ? extension.toUpperCase() : "Plain Text");

  const monacoLanguageMap = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    html: "html",
    css: "css",
    scss: "scss",
    json: "json",
    py: "python",
    java: "java",
    php: "php",
  };

  const stripHtml = (html) => {
    if (!html) return "";
    const normalized = String(html)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>\s*<p>/gi, "\n");

    if (typeof window !== "undefined" && window.document) {
      const temp = window.document.createElement("div");
      temp.innerHTML = normalized;
      return temp.textContent || temp.innerText || "";
    }

    return normalized
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  };

  const sourceText = (fileContent.sources || []).map((src) => stripHtml(src.code)).join("\n");
  const monacoLanguage = monacoLanguageMap[extension] || "plaintext";

  return (
    <Box className="space-y-4">
      <Card className="border-slate-200">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-slate-500">
                <InsertDriveFileOutlinedIcon className="h-4 w-4" />
                <span className="text-xs uppercase tracking-wide">Active file</span>
              </div>
              <Typography className="mt-1 truncate text-sm font-medium text-slate-900">
                {displayPath}
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyPath}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <ContentCopyIcon className="h-3.5 w-3.5" />
                Copy path
              </button>
              <MetricMenu />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {overviewMetrics.map((m) => (
              <MetricCard key={m.label} label={m.label} value={m.value} />
            ))}
            <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
            {qualityMetrics.map((m) => (
              <MetricCard key={m.label} label={m.label} value={m.value} />
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
              {fileContent.sources?.length || 0} lines loaded
            </Badge>
            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
              Syntax highlighting enabled
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Paper className="overflow-hidden rounded-xl border border-[#2d2d30] bg-[#1e1e1e] shadow-sm">
        <div className="flex items-center justify-between border-b border-[#2d2d30] bg-[#252526] px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <div className="text-[11px] text-[#8c8c8c]">Read-only editor</div>
        </div>

        <div className="flex items-center justify-between border-b border-[#2d2d30] bg-[#1e1e1e] px-3">
          <div className="inline-flex items-center gap-2 border-b-2 border-[#007acc] px-1 py-2 text-xs text-[#cccccc]">
            <InsertDriveFileOutlinedIcon className="h-3.5 w-3.5 text-[#75beff]" />
            <span className="max-w-[260px] truncate">{fileName}</span>
          </div>
          <div className="text-[11px] text-[#8c8c8c]">
            {languageLabel} • {fileContent.sources?.length || 0} lines
          </div>
        </div>

        <Box className="max-h-[68vh] overflow-hidden bg-[#1e1e1e]">
          {(fileContent.sources || []).length > 0 ? (
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
          ) : (
            <div className="px-4 py-10 text-center text-sm text-[#8c8c8c]">
              No source lines available for this file.
            </div>
          )}
        </Box>
      </Paper>

      {snackbarOpen && (
        <div className="fixed right-4 top-4 z-50 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 shadow">
          Copied to clipboard!
        </div>
      )}
    </Box>
  );
};

export default FileView;
