import {
  Autocomplete,
  TextField,
  CircularProgress,
  Modal,
  Box,
  Typography,
  Button,
  Divider,
  MenuItem,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined"; // repo icon
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CallSplitOutlinedIcon from "@mui/icons-material/CallSplitOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import React, { useEffect, useState } from "react";
import { fetchRepos, fetchBranches } from "../../utils/Helpers";

const PushToGitHubModal = ({ open, onClose, onSubmit, githubUsername }) => {
  const [repoOptions, setRepoOptions] = useState([]);
  const [repoName, setRepoName] = useState("");
  const [description, setDescription] = useState("");
  const [branch, setBranch] = useState("");
  const [branchOptions, setBranchOptions] = useState([]);
  const [visibility, setVisibility] = useState("public");

  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [branchError, setBranchError] = useState("");
  const [formTouched, setFormTouched] = useState(false);

  // 🔹 Load repos when modal opens
  useEffect(() => {
    if (!open || !githubUsername) return;

    const loadRepos = async () => {
      setLoadingRepos(true);
      setFetchError("");
      try {
        const repos = await fetchRepos(githubUsername, "github");
        const names = repos.map((repo) => repo.name || repo);
        setRepoOptions(names);
      } catch (err) {
        console.error("❌ Repo fetch failed", err);
        setFetchError("❌ Failed to fetch repositories");
      } finally {
        setLoadingRepos(false);
      }
    };

    loadRepos();
  }, [open, githubUsername]);

    useEffect(() => {
    if (!repoName || !githubUsername) return;

    const loadBranches = async () => {
      setLoadingBranches(true);
      setBranchError("");
      try {
        // Construct full repo name as "username/repoName"
        const fullRepoName = `${githubUsername}/${repoName}`;
        const branchesData = await fetchBranches(fullRepoName, "github", githubUsername);
        const branchNames = (branchesData.branches || []).map((b) => b.name || b);
        setBranchOptions(branchNames);
      } catch (err) {
        console.error("❌ Branch fetch failed", err);
        setBranchOptions([]);
        setBranchError("❌ Failed to fetch branches");
      } finally {
        setLoadingBranches(false);
      }
    };

    loadBranches();
  }, [repoName, githubUsername]);



  const handlePush = () => {
    setFormTouched(true);
    if (!repoName.trim() || !branch.trim() || /\s/.test(branch)) return;
    onSubmit({ repoName: repoName.trim(), description, branch, visibility });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      BackdropProps={{ className: "modal-blur-backdrop" }}
    >
      <Box className="push-modal">
        <IconButton
          aria-label="Close push dialog"
          className="push-close-btn"
          size="small"
          onClick={onClose}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
        <Typography variant="h6" className="push-modal-title">Push To GitHub</Typography>
        <Typography className="push-modal-subtext">Provide the required GitHub details to push the code.</Typography>

        <Divider className="push-modal-divider" />

        <div className="push-form-field">
          <Typography className="push-label">
            <Inventory2OutlinedIcon fontSize="small" className="push-label-icon" /> Repo Name <span className="req">*</span>
          </Typography>
          <Autocomplete
            freeSolo
            options={repoOptions}
            loading={loadingRepos}
            value={repoName}
            onInputChange={(e, newValue) => setRepoName(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select or type new repo name"
                size="small"
                fullWidth
                error={formTouched && !repoName}
                helperText={
                  fetchError
                    ? fetchError
                    : formTouched && !repoName
                    ? "Repository name is required"
                    : ""
                }
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingRepos ? <CircularProgress size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </div>

        <div className="push-form-field">
          <Typography className="push-label">
            <CallSplitOutlinedIcon fontSize="small" className="push-label-icon" /> Branch <span className="req">*</span>
          </Typography>
          <Autocomplete
            freeSolo
            options={branchOptions}
            loading={loadingBranches}
            value={branch}
            onInputChange={(e, newValue) => setBranch(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select or type branch name"
                size="small"
                fullWidth
                error={formTouched && (!branch || /\s/.test(branch))}
                helperText={
                  branchError
                    ? branchError
                    : formTouched &&
                      (!branch
                        ? "Branch name is required"
                        : /\s/.test(branch)
                        ? "No spaces allowed in branch name"
                        : "")
                }
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingBranches ? <CircularProgress size={16} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </div>

        <div className="push-form-field">
          <Typography className="push-label">
            <DescriptionOutlinedIcon fontSize="small" className="push-label-icon" /> Description
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="push-form-field">
          <Typography className="push-label">
            <VisibilityOutlinedIcon fontSize="small" className="push-label-icon" /> Visibility
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <MenuItem value="public">Public</MenuItem>
            <MenuItem value="private">Private</MenuItem>
          </TextField>
        </div>

        <div className="push-modal-actions">
          <Button className="push-cancel" onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            className="push-submit"
            onClick={handlePush}
            disabled={!repoName || !branch || /\s/.test(branch)}
          >
            Push
          </Button>
        </div>
      </Box>
    </Modal>
  );
};

export default PushToGitHubModal;
