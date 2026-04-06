import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, FileText, Code, Loader2 } from "lucide-react";
import debounce from "lodash.debounce";
import { ChatApiService } from "../../services";
import DiffViewerModal from "./DiffViewerModal";
import PushToGitHubModal from "./PushToGitHubModal";
import TerraformPlanModal from "./TerraformPlanModal";
import TerraformErrorModal from "./TerraformErrorModal";
import BusyBackdrop from "../common/BusyBackdrop";
import SnackbarNotification, {
  SNACKBAR_THEME,
} from "../../components/common/SnackbarNotification";

const Box = ({ children, className = "" }) => <div className={className}>{children}</div>;
const Typography = ({ children, className = "" }) => <p className={className}>{children}</p>;
const Divider = () => <hr className="my-4 border-slate-200" />;
const List = ({ children, className = "" }) => <ul className={className}>{children}</ul>;
const ListItem = ({ children, className = "", selected, onClick }) => (
  <li className={`${className} cursor-pointer ${selected ? "bg-blue-50" : ""}`} onClick={onClick}>{children}</li>
);

const EditorModal = ({
  open,
  onClose,
  files,
  onSave,
  messages,
  setMessages,
  onAskAI,
}) => {
  const fileKeys = files ? Object.keys(files) : [];
  const [selectedFile, setSelectedFile] = useState(fileKeys[0] || "");
  const [fileContents, setFileContents] = useState(files || {});
  const [saving, setSaving] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [lastPushedFiles, setLastPushedFiles] = useState([]);
  const [viewChangesEnabled, setViewChangesEnabled] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [githubUsername, setGithubUsername] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [runningPlan, setRunningPlan] = useState(false);
  const [showTFModal, setShowTFModal] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ✅ Snackbar state
  const [snackbarStatus, setSnackbarStatus] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState(null);

  useEffect(() => {
    if (open) {  
      const github_username = localStorage.getItem("github_username");
      if (!github_username) {
        setSnackbarStatus("error");
        setSnackbarMessage("Please connect your GitHub account first.");
        onClose();
        return;
      }
      setGithubUsername(github_username);
    }
  }, [open]); 


  useEffect(() => {
    if (files) {
      setFileContents(files);
      setSelectedFile(Object.keys(files)[0] || "");
    }
  }, [files]);

  const debouncedSave = useCallback(
    debounce((newFiles) => {
      setSaving(true);
      const updatedMsgs = messages.map((msg) =>
        msg.sender === "assistant" && msg.files
          ? { ...msg, files: newFiles }
          : msg
      );
      setMessages(updatedMsgs);
      setSaving(false);
    }, 1000),
    [messages, setMessages]
  );

  // Refs for line-number gutter sync
  const editorGutterRef = useRef(null);
  const editorAreaRef = useRef(null);

  const selectedContent = fileContents[selectedFile] || "";
  const lineCount = Math.max(1, selectedContent.split("\n").length);

  const handleEditorScroll = (e) => {
    if (editorGutterRef.current) {
      editorGutterRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const handleFileChange = (filename, value) => {
    const newContents = { ...fileContents, [filename]: value };
    setFileContents(newContents);
    setSaving(true);
    debouncedSave(newContents);
  };

  const handlePush = async (gitDetails) => {
    try {
      setPushing(true);
      const res = await onSave(fileContents, gitDetails);
      setLastPushedFiles(res);
      setViewChangesEnabled(true);
      setTimeout(() => setShowDiff(true), 200);

      setSnackbarStatus("success");
      setSnackbarMessage("✅ Changes pushed to GitHub!");
    } catch (err) {
      console.error("❌ Push failed", err);
      setSnackbarStatus("error");
      setSnackbarMessage("Failed to push changes.");
    } finally {
      setPushing(false);
    }
  };

  const handleRunTFPlan = async (userAccountId, repoUrl) => {
    try {
      setRunningPlan(true);
      const userId = localStorage.getItem("userId");
      const github_username = localStorage.getItem("github_username");

      const payload = {
        userId,
        userAccountId,
        repoUrl,
        github_username,
      };

      const data = await ChatApiService.deployToAWS(payload);

      const tfError = data?.data?.response?.error;

      if (tfError) {
        setErrorMessage(tfError);
        setErrorModalOpen(true);
      } else if (data?.error?.message) {
        setErrorMessage(data.error.message);
        setErrorModalOpen(true);
      } else {
        setSnackbarStatus("success");
        setSnackbarMessage("✅ Terraform Plan executed successfully!");
      }
    } catch (error) {
      setErrorMessage(error?.message || "Unknown error occurred");
      setErrorModalOpen(true);
    } finally {
      setRunningPlan(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="editor-modal relative w-full max-w-5xl rounded-lg bg-white p-6 shadow-lg">
          <button
            aria-label="Close editor"
            className="editor-close-btn absolute right-2 top-2 rounded p-1 hover:bg-slate-100"
            onClick={onClose}
          >
            <X size={18} />
          </button>
          <Box className="editor-topbar">
            <Typography className="editor-title">Editor</Typography>
            <Typography className="editor-saving">
              {saving ? "Saving changes..." : "All changes saved"}
            </Typography>
          </Box>

          {fileKeys.length === 0 ? (
            <Typography className="editor-empty">No files to show.</Typography>
          ) : (
            <Box className="editor-body flex gap-4">
              <Box className="editor-sidebar w-64">
                <Typography className="editor-title mb-2 font-semibold">
                  Terraform Files
                </Typography>
                <Divider />
                <List className="mt-2">
                  {fileKeys.map((file) => (
                    <ListItem
                      key={file}
                      selected={selectedFile === file}
                      onClick={() => setSelectedFile(file)}
                      className="editor-file-item flex items-center gap-2 rounded px-2 py-1 hover:bg-slate-100"
                    >
                      <span className="editor-file-icon">
                        {file.endsWith(".tf") || file.endsWith(".tfvars") ? (
                          <Code size={16} className="text-blue-500" />
                        ) : (
                          <FileText size={16} />
                        )}
                      </span>
                      {file}
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Box className="editor-content">
                <Typography variant="subtitle1" className="editor-filename">
                  {selectedFile}
                </Typography>
                <Box className="editor-code-wrapper">
                  <Box className="editor-gutter" ref={editorGutterRef}>
                    {Array.from({ length: lineCount }, (_, i) => (
                      <div className="editor-gutter-line" key={i}>{i + 1}</div>
                    ))}
                  </Box>
                  <textarea
                    className="editor-textarea min-h-[400px] w-full rounded border border-slate-300 p-2 font-mono text-sm focus:border-blue-500 focus:outline-none"
                    rows={20}
                    value={selectedContent}
                    onChange={(e) => handleFileChange(selectedFile, e.target.value)}
                    onScroll={handleEditorScroll}
                    ref={editorAreaRef}
                  />
                </Box>
                <Box className="editor-actions mt-4 flex gap-2">
                  <button
                    className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    onClick={() => setShowTFModal(true)}
                    disabled={runningPlan}
                  >
                    {runningPlan ? "Running..." : "Terraform Plan"}
                  </button>

                  <button
                    className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    onClick={() => setShowTFModal(true)}
                    disabled={runningPlan}
                  >
                    {runningPlan ? "Running..." : "Terraform Apply"}
                  </button>

                  <button
                    className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    onClick={() => setShowDiff(true)}
                    disabled={!viewChangesEnabled}
                  >
                    View Changes
                  </button>
                  <button
                    className="flex items-center gap-2 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    onClick={() => setShowPushModal(true)}
                    disabled={pushing}
                  >
                    {pushing && <Loader2 className="h-4 w-4 animate-spin" />}
                    {pushing ? "Pushing..." : "Push to GitHub"}
                  </button>
                </Box>
              </Box>
            </Box>
          )}
        </div>
      </div>

      {/* Global backdrop while pushing to GitHub */}
      <BusyBackdrop open={pushing} text="Pushing to GitHub..." />

      <DiffViewerModal
        open={showDiff}
        onClose={() => setShowDiff(false)}
        files={lastPushedFiles}
      />

      <PushToGitHubModal
        open={showPushModal}
        onClose={() => setShowPushModal(false)}
        onSubmit={(gitDetails) => {
          setShowPushModal(false);
          handlePush(gitDetails);
        }}
        githubUsername={githubUsername}
      />

      <TerraformPlanModal
        open={showTFModal}
        onClose={() => setShowTFModal(false)}
        onSubmit={async ({ userAccountId, repoUrl }) => {
          // Keep modal open to show its loader; close after the run completes
          await handleRunTFPlan(userAccountId, repoUrl);
          setShowTFModal(false);
        }}
      />

      <TerraformErrorModal
        open={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        errorMessage={errorMessage}
        onAskAI={(prompt) => {
          setErrorModalOpen(false);
          if (onAskAI) {
            onAskAI(prompt);
          } else {
            console.warn("Missing onAskAI handler");
          }
        }}
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

export default EditorModal;
