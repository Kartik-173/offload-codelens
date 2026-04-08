import React, { useEffect, useRef } from "react";
import { Copy, ExternalLink, AlertCircle } from "lucide-react";
import Editor from "@monaco-editor/react";
import { Button } from "../../../../ui/button";
import { Badge } from "../../../../ui/badge";

const RiskTab = ({ filePath, codeValue, hotspot, handleCopyPath, handleEditorMount }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    handleEditorMount?.(editor, monaco);

    highlightError(hotspot);
  };

  const highlightError = (hotspot) => {
    if (!editorRef.current || !monacoRef.current || !hotspot) return;

    let { startLine, startOffset, endLine, endOffset } = hotspot.textRange;

    // ✅ Highlight error with red underline
    editorRef.current.deltaDecorations([], [
      {
        range: new monacoRef.current.Range(
          startLine,
          startOffset + 1,
          endLine,
          endOffset + 1
        ),
        options: {
          inlineClassName: "highlight-error",
          hoverMessage: { value: "⚠️ " + hotspot.message },
          className: "highlight-error",
          overviewRuler: { color: "#ef4444", position: 4 },
          minimap: { color: "#ef4444", position: 2 },
        },
      },
    ]);

    // ✅ Scroll/focus logic
    if (startLine > 5) {
      // Only scroll if error is not in top 5 lines
      const revealLine = Math.max(startLine - 5, 1);
      editorRef.current.revealLineInCenter(revealLine);

      editorRef.current.setSelection(
        new monacoRef.current.Selection(
          startLine - 5,
          startOffset + 1,
          endLine - 5,
          endOffset + 1
        )
      );
    } else {
      // Just ensure it’s visible without shifting
      editorRef.current.revealLineInCenter(startLine);
      editorRef.current.setSelection(
        new monacoRef.current.Selection(
          startLine,
          startOffset + 1,
          endLine,
          endOffset + 1
        )
      );
    }
  };

  useEffect(() => {
    if (editorRef.current && hotspot) {
      highlightError(hotspot);
    }
  }, [hotspot]);

  return (
    <div className="space-y-3">
      {/* Inline styles for Monaco editor highlighting */}
      <style>{`
        .highlight-error {
          background-color: rgba(239, 68, 68, 0.15) !important;
          border-bottom: 2px solid #ef4444;
          text-decoration: underline wavy #ef4444;
          text-underline-offset: 2px;
        }
      `}</style>

      {/* File Path Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm text-slate-700 truncate font-mono">{filePath}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 flex-shrink-0"
            onClick={handleCopyPath}
            title="Copy path"
          >
            <Copy className="h-3.5 w-3.5 text-slate-400" />
          </Button>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-shrink-0 text-xs h-8"
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
          Open in IDE
        </Button>
      </div>

      {/* Alert Callout */}
      <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-md">
        <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-700 font-medium">{hotspot.message}</p>
      </div>

      {/* Code Editor */}
      <div className="border border-slate-200 rounded-md overflow-hidden">
        <Editor
          height="300px"
          defaultLanguage="javascript"
          value={codeValue}
          onMount={handleEditorDidMount}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            glyphMargin: false,
            folding: false,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            renderLineHighlight: "line",
            automaticLayout: true,
          }}
          className="hotspot-monaco-editor"
        />
      </div>
    </div>
  );
};

export default RiskTab;
