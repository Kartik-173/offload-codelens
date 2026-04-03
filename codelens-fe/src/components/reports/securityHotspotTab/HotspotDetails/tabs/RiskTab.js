import React, { useEffect, useRef } from "react";
import { Box, Typography, Button } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
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
    <Box className="hotspot-code-card">
      <Box className="hotspot-code-header">
        <Box className="hotspot-code-header-left">
          <Typography className="hotspot-code-path">{filePath}</Typography>
          <ContentCopyIcon
            fontSize="small"
            onClick={handleCopyPath}
            className="file-view-copy-icon"
          />
        </Box>
        <Button variant="outlined" className="open-ide-btn">
          Open in IDE
        </Button>
      </Box>

      <Box className="hotspot-callout">
        <Typography className="hotspot-callout-text">
          {hotspot.message}
        </Typography>
      </Box>

      <Box className="monaco-wrapper">
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
      </Box>
    </Box>
  );
};

export default RiskTab;
