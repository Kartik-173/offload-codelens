import React, { useState, useRef, useEffect } from "react";
import { Box, Typography, Snackbar, Alert } from "@mui/material";
import { getPriorityIcon } from "../../../../utils/Helpers";
import HotspotHeader from "./HotspotHeader";
import HotspotTabs from "./HotspotTabs";

const HotspotDetails = ({ selectedHotspot }) => {
  const [activeTab, setActiveTab] = useState("risk");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  // ✅ Hotspot object
  const hotspot = selectedHotspot || null;

  // File path fallback
  const filePath =
    hotspot?.component?.path ||
    hotspot?.component?.longName ||
    hotspot?.component?.name ||
    "";

  // Copy path handler
  const handleCopyPath = () => {
    if (filePath) {
      navigator.clipboard.writeText(filePath);
      setSnackbarOpen(true);
    }
  };

  // Editor mount callback
  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    setTimeout(() => editor?.layout(), 0);

    const resizeHandler = () => editor?.layout();
    window.addEventListener("resize", resizeHandler);
    return () => window.removeEventListener("resize", resizeHandler);
  };

  // Highlight hotspot lines
  useEffect(() => {
    if (!hotspot || !editorRef.current || !monacoRef.current) return;

    const startLine = hotspot?.textRange?.startLine || hotspot?.line || 1;
    const endLine = hotspot?.textRange?.endLine || hotspot?.line || startLine;
    const monaco = monacoRef.current;
    const range = new monaco.Range(startLine, 1, endLine, 1);

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      [
        {
          range,
          options: {
            isWholeLine: true,
            className: "hotspot-monaco-line-highlight",
            linesDecorationsClassName: "hotspot-monaco-gutter-highlight",
          },
        },
      ]
    );

    editorRef.current.revealRangeInCenter(range);
  }, [hotspot]);

  // Empty state
  if (!hotspot) {
    return (
      <Box className="hotspot-details">
        <Typography variant="body2" className="hotspot-empty">
          Select a hotspot to view details
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="hotspot-details">
      <HotspotHeader
        hotspot={hotspot}
        handleCopyPath={handleCopyPath}
        getPriorityIcon={getPriorityIcon}
      />

      <HotspotTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hotspot={hotspot}
        filePath={filePath}
        handleCopyPath={handleCopyPath}
        handleEditorMount={handleEditorMount}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="success" className="hotspot-toast">
          Copied to clipboard!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HotspotDetails;
