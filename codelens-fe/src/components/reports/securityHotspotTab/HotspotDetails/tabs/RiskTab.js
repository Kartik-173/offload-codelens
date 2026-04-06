import React, { useEffect, useRef } from "react";
import { Copy } from "lucide-react";
import Editor from "@monaco-editor/react";

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

    // ✅ Highlight error
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
    <div className="hotspot-code-card">
      <div className="hotspot-code-header">
        <div className="hotspot-code-header-left">
          <p className="hotspot-code-path text-sm text-slate-700">{filePath}</p>
          <Copy
            onClick={handleCopyPath}
            className="file-view-copy-icon h-4 w-4 cursor-pointer"
          />
        </div>
        <button type="button" className="open-ide-btn rounded-md border px-3 py-1.5 text-sm hover:bg-slate-50">
          Open in IDE
        </button>
      </div>

      <div className="hotspot-callout">
        <p className="hotspot-callout-text">{hotspot.message}</p>
      </div>

      <div className="monaco-wrapper">
        <Editor
          height="370px"
          defaultLanguage="typescript"
          value={codeValue}
          onMount={handleEditorDidMount}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            glyphMargin: false,
            folding: false,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            renderLineHighlight: "none",
            automaticLayout: false,
          }}
          className="hotspot-monaco-editor"
        />
      </div>
    </div>
  );
};

export default RiskTab;
