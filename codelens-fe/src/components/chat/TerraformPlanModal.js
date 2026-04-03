import React, { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import CredentialsApiService from "../../services/CredentialsApiService";
import BusyBackdrop from "../common/BusyBackdrop";
import { fetchRepos } from "../../utils/Helpers";

const TerraformPlanModal = ({ open, onClose, onSubmit }) => {
  const [userAccountId, setuserAccountId] = useState("");
  const [repoUrl, setrepoUrl] = useState("");
  const [accountOptions, setAccountOptions] = useState([]);
  const [repoOptions, setRepoOptions] = useState([]); // array of fullName strings
  const [reposData, setReposData] = useState([]);     // raw objects to access url
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepoFullName, setSelectedRepoFullName] = useState(null);
  const navigate = useNavigate();

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        if (userId) {
          const res = await CredentialsApiService.listAccountIds(userId);
          const payload = res?.data?.data || res?.data || {};
          const ids = payload.accountIds || [];
          const accounts = Array.isArray(payload.accounts) ? payload.accounts : null;
          const opts = accounts
            ? accounts
                .map((a) => ({
                  accountId: String(a?.accountId ?? a?.id ?? ''),
                  name: a?.name || '',
                }))
                .filter((a) => a.accountId)
            : ids.map((id) => ({ accountId: String(id), name: '' }));
          setAccountOptions(opts);
        }
      } catch (error) {
        console.error("Failed to fetch account IDs", error);
      }
    };

    if (open) fetchAccounts();
  }, [open]);

  // Load GitHub repos for dropdown
  useEffect(() => {
    const loadRepos = async () => {
      try {
        setLoadingRepos(true);
        const username = localStorage.getItem("github_username");
        if (!username) {
          setRepoOptions([]);
          setReposData([]);
          return;
        }
        const repos = await fetchRepos(username, "github");
        setReposData(repos || []);
        const options = (repos || []).map((r) => r.fullName).filter(Boolean);
        setRepoOptions(options);
      } catch (e) {
        console.error("Failed to load GitHub repos", e);
        setRepoOptions([]);
        setReposData([]);
      } finally {
        setLoadingRepos(false);
      }
    };
    if (open) loadRepos();
  }, [open]);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!userAccountId || !repoUrl) {
      alert("Please fill in both fields.");
      return;
    }

    try {
      setSubmitting(true);
      const result = onSubmit({ userAccountId, repoUrl });
      if (result && typeof result.then === "function") {
        await result; // handle Promise-returning submitters
      }
      setuserAccountId("");
      setrepoUrl("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccountSelect = (e) => {
    if (e.target.value === "add-new") {
      navigate("/credentials");
      return;
    }
    setuserAccountId(e.target.value);
  };

  return (
    <>
    <Modal open={open} onClose={onClose} className="modal-blur-backdrop">
      <Box className="terraform-modal">
        <IconButton
          aria-label="Close terraform plan dialog"
          className="terraform-close-btn"
          size="small"
          onClick={onClose}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
        <Typography variant="h6" className="terraform-modal-title">
          Run Terraform Plan
        </Typography>
        <Typography className="terraform-modal-subtext">
          Select an AWS Account and GitHub repo URL to run the Terraform plan.
        </Typography>

        {/* GitHub Repo dropdown (like Scan Repo page) */}
        <Box className="terraform-form-field">
          <FormControl fullWidth size="small">
            <InputLabel id="repo-select-label">Repository</InputLabel>
            <Select
              labelId="repo-select-label"
              value={selectedRepoFullName || ""}
              onChange={(e) => {
                const fullName = e.target.value;
                const repoObj = reposData.find((r) => r.fullName === fullName);
                setSelectedRepoFullName(fullName);
                if (repoObj?.url) setrepoUrl(repoObj.url);
                else if (fullName) setrepoUrl(`https://github.com/${fullName}`);
              }}
              label="Repository"
            >
              {loadingRepos ? (
                <MenuItem disabled>
                  <CircularProgress size={20} className="dropdown-loader" />
                  <span className="loader-text" style={{ marginLeft: 8 }}>Loading Repositories...</span>
                </MenuItem>
              ) : (
                reposData.map((repo) => (
                  <MenuItem key={repo.id || repo.fullName} value={repo.fullName}>
                    {repo.name || repo.fullName.split('/').pop()}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Box>

        <Box className="terraform-form-field">
          <FormControl fullWidth size="small">
            <InputLabel id="account-select-label" style={{ color: "#aaa" }}>
              Select Account ID
            </InputLabel>
            <Select
              labelId="account-select-label"
              value={userAccountId}
              onChange={handleAccountSelect}
              size="small"
              displayEmpty
            >
              {accountOptions.map((opt) => (
                <MenuItem key={opt.accountId} value={opt.accountId}>
                  {opt?.name ? `${opt.accountId}-${opt.name}` : opt.accountId}
                </MenuItem>
              ))}
              <MenuItem value="add-new">
                ➕ Add New AWS Account
              </MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box className="terraform-modal-actions">
          <Button variant="outlined" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {submitting ? "Running..." : "Run Plan"}
          </Button>
        </Box>
      </Box>
    </Modal>
    <BusyBackdrop open={submitting} text="Running Terraform plan..." />
    </>
  );
};

export default TerraformPlanModal;
