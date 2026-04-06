import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import ReactDiffViewer from "react-diff-viewer-continued";
import axios from "axios";
import APIConstants from "../../services/APIConstants";
import SnackbarNotification, {
  SNACKBAR_THEME,
} from "../../components/common/SnackbarNotification";
import BusyBackdrop from "../common/BusyBackdrop";

const Box = ({ children, className = "" }) => <div className={className}>{children}</div>;
const Typography = ({ children, className = "" }) => <p className={className}>{children}</p>;

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

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50">
        <div className="diff-dialog-paper mx-auto my-8 h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-lg">
          <div className="diff-header-bar flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Typography className="diff-title text-lg font-semibold">File Changes</Typography>
            </div>
            <div className="diff-action-buttons flex items-center gap-2">
              <button
                className="diff-btn danger flex items-center gap-2 rounded border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                onClick={handleClosePR}
                disabled={Boolean(actionLoading)}
              >
                {actionLoading === "close" && <Loader2 className="h-4 w-4 animate-spin" />}
                {actionLoading === "close" ? "Closing PR..." : "Close PR"}
              </button>
              <button
                className="diff-btn primary flex items-center gap-2 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                onClick={handleMergePR}
                disabled={Boolean(actionLoading)}
              >
                {actionLoading === "merge" && <Loader2 className="h-4 w-4 animate-spin" />}
                {actionLoading === "merge" ? "Merging PR..." : "Merge PR"}
              </button>
              <button
                className="diff-close-btn rounded p-1 hover:bg-slate-100 disabled:opacity-50"
                onClick={onClose}
                disabled={Boolean(actionLoading)}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="h-[calc(90vh-60px)] overflow-auto p-4">
            {files.map((file, idx) => {
              const { oldText, newText } = parsePatchToDiff(file.patch);
              return (
                <Box key={idx} className="diff-file-block mb-4">
                  <Box className="diff-file-header mb-2 flex items-center gap-2 bg-slate-100 px-3 py-2">
                    <Typography component="span" className="filename font-medium">
                      {file.filename}
                    </Typography>
                    <Typography component="span" className="status text-sm text-slate-500">
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
          </div>
        </div>
      </div>

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
