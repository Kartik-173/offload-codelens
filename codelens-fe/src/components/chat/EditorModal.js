import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Modal,
  Box,
  List,
  ListItem,
  ListItemIcon,
  Typography,
  Button,
  Divider,
  TextareaAutosize,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import CodeIcon from "@mui/icons-material/Code";
import debounce from "lodash.debounce";
import { ChatApiService } from "../../services";
import DiffViewerModal from "./DiffViewerModal";
import PushToGitHubModal from "./PushToGitHubModal";
import TerraformPlanModal from "./TerraformPlanModal";
import TerraformErrorModal from "./TerraformErrorModal";
import BusyBackdrop from "../common/BusyBackdrop";

// ✅ Import SnackbarNotification
import SnackbarNotification, {
  SNACKBAR_THEME,
} from "../../components/common/SnackbarNotification";

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

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <Box className="editor-modal">
          {/* Close (X) button like VS Code */}
          <IconButton
            aria-label="Close editor"
            className="editor-close-btn"
            size="small"
            onClick={onClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          <Box className="editor-topbar">
            <Typography className="editor-title">Editor</Typography>
            <Typography className="editor-saving">
              {saving ? "Saving changes..." : "All changes saved"}
            </Typography>
          </Box>

          {fileKeys.length === 0 ? (
            <Typography className="editor-empty">No files to show.</Typography>
          ) : (
            <Box className="editor-body">
              <Box className="editor-sidebar">
                <Typography className="editor-title">
                  Terraform Files
                </Typography>
                <Divider />
                <List>
                  {fileKeys.map((file) => (
                    <ListItem
                      key={file}
                      button
                      selected={selectedFile === file}
                      onClick={() => setSelectedFile(file)}
                      className="editor-file-item"
                    >
                      <ListItemIcon className="editor-file-icon">
                        {file.endsWith(".tf") || file.endsWith(".tfvars") ? (
                          <CodeIcon fontSize="small" color="primary" />
                        ) : (
                          <InsertDriveFileOutlinedIcon fontSize="small" />
                        )}
                      </ListItemIcon>
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
                  <TextareaAutosize
                    className="editor-textarea"
                    minRows={20}
                    value={selectedContent}
                    onChange={(e) => handleFileChange(selectedFile, e.target.value)}
                    onScroll={handleEditorScroll}
                    ref={editorAreaRef}
                  />
                </Box>
                <Box className="editor-actions">
                  <Button
                    variant="outlined"
                    onClick={() => setShowTFModal(true)}
                    disabled={runningPlan}
                  >
                    {runningPlan ? "Running..." : "Terraform Plan"}
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() => setShowTFModal(true)}
                    disabled={runningPlan}
                  >
                    {runningPlan ? "Running..." : "Terraform Apply"}
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() => setShowDiff(true)}
                    disabled={!viewChangesEnabled}
                  >
                    View Changes
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setShowPushModal(true)}
                    disabled={pushing}
                    startIcon={pushing ? <CircularProgress size={16} color="inherit" /> : null}
                  >
                    {pushing ? "Pushing..." : "Push to GitHub →"}
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Modal>

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
