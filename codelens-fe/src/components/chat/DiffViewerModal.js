import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  Box,
  Button,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReactDiffViewer from "react-diff-viewer-continued";
import axios from "axios";
import APIConstants from "../../services/APIConstants";
import SnackbarNotification, {
  SNACKBAR_THEME,
} from "../../components/common/SnackbarNotification";
import BusyBackdrop from "../common/BusyBackdrop";

const parsePatchToDiff = (patch) => {
  if (!patch) return { oldText: "", newText: "" };

  const lines = patch.split("\n");
  const oldLines = [];
  const newLines = [];

  for (let line of lines) {
    if (line.startsWith("+") && !line.startsWith("++")) {
      newLines.push(line.slice(1));
    } else if (line.startsWith("-") && !line.startsWith("--")) {
      oldLines.push(line.slice(1));
    } else if (!line.startsWith("@@")) {
      oldLines.push(line);
      newLines.push(line);
    }
  }

  return {
    oldText: oldLines.join("\n"),
    newText: newLines.join("\n"),
  };
};

const DiffViewerModal = ({ open, onClose, files = [] }) => {
  // ✅ Snackbar state
  const [snackbarStatus, setSnackbarStatus] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState(null);
  // ✅ Action loading state: 'merge' | 'close' | null
  const [actionLoading, setActionLoading] = useState(null);

  const handleMergePR = async () => {
    setActionLoading("merge");
    try {
      const meta = files?.[0];
      if (!meta) {
        setSnackbarStatus("error");
        setSnackbarMessage("Missing PR metadata");
        return;
      }

      await axios.post(APIConstants.CHAT.MERGE_PR, {
        owner: meta.owner,
        repo: meta.repo,
        branch: meta.head,
        pr_number: meta.pr_number,
        github_username: localStorage.getItem("github_username"),
        approved: true,
      });

      setSnackbarStatus("success");
      setSnackbarMessage("✅ PR merged successfully!");
    } catch (err) {
      console.error("❌ Merge failed:", err);
      setSnackbarStatus("error");
      setSnackbarMessage("Failed to merge PR");
    } finally {
      setActionLoading(null);
    }
  };

  const handleClosePR = async () => {
    setActionLoading("close");
    try {
      const meta = files?.[0];
      if (!meta) {
        setSnackbarStatus("error");
        setSnackbarMessage("Missing PR metadata");
        return;
      }

      await axios.post(APIConstants.CHAT.MERGE_PR, {
        owner: meta.owner,
        repo: meta.repo,
        branch: meta.head,
        pr_number: meta.pr_number,
        github_username: localStorage.getItem("github_username"),
        approved: false,
      });

      setSnackbarStatus("success");
      setSnackbarMessage("❎ PR closed.");
    } catch (err) {
      console.error("❌ Close failed:", err);
      setSnackbarStatus("error");
      setSnackbarMessage("Failed to close PR");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{ className: "diff-dialog-paper" }}
      >
        <DialogTitle>
          <Box className="diff-header-bar">
            <Typography variant="h6" className="diff-title">
              File Changes
            </Typography>
            <Box className="diff-action-buttons">
              <Button
                className="diff-btn danger"
                onClick={handleClosePR}
                disabled={Boolean(actionLoading)}
                startIcon={actionLoading === "close" ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {actionLoading === "close" ? "Closing PR..." : "Close PR"}
              </Button>
              <Button
                className="diff-btn primary"
                onClick={handleMergePR}
                disabled={Boolean(actionLoading)}
                startIcon={actionLoading === "merge" ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {actionLoading === "merge" ? "Merging PR..." : "Merge PR"}
              </Button>
              <IconButton className="diff-close-btn" onClick={onClose} disabled={Boolean(actionLoading)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {files.map((file, idx) => {
            const { oldText, newText } = parsePatchToDiff(file.patch);
            return (
              <Box key={idx} className="diff-file-block">
                <Box className="diff-file-header">
                  <Typography component="span" className="filename">
                    {file.filename}
                  </Typography>
                  <Typography component="span" className="status">
                    ({file.status})
                  </Typography>
                </Box>
                <Box className="diff-content">
                  <ReactDiffViewer
                    oldValue={oldText}
                    newValue={newText}
                    splitView={false}
                    showDiffOnly
                    hideLineNumbers={false}
                    useDarkTheme={false}
                  />
                </Box>
              </Box>
            );
          })}
        </DialogContent>
      </Dialog>

      {/* Global backdrop while merging/closing PR */}
      <BusyBackdrop
        open={Boolean(actionLoading)}
        text={actionLoading === "merge" ? "Merging PR..." : actionLoading === "close" ? "Closing PR..." : ""}
      />

      {/* ✅ Snackbar */}
      {snackbarStatus && (
        <SnackbarNotification
          initialOpen={true}
          duration={5000}
          message={snackbarMessage}
          actionButtonName={"Ok"}
          theme={
            snackbarStatus === "success"
              ? SNACKBAR_THEME.GREEN
              : SNACKBAR_THEME.RED
          }
          yPosition={"top"}
          xPosition={"center"}
        />
      )}
    </>
  );
};

export default DiffViewerModal;
