import React, { useEffect, useState } from "react";
import {
  Typography,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import { fetchBranches, fetchRepos } from "../utils/Helpers";
import RepoApiService from "../services/RepoApiService";
import SnackbarNotification, {
  SNACKBAR_THEME,
} from "../components/common/SnackbarNotification";
import { ENV } from '../config/env';

const ScanRepo = () => {
  const [repos, setRepos] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [selectedRepoUrl, setSelectedRepoUrl] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [snackbarStatus, setSnackbarStatus] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("github");

  const userId = localStorage.getItem("userId");
  const organization = ENV.ORGANIZATION_NAME;

  // Fetch repositories when provider changes
  useEffect(() => {
    const loadRepos = async () => {
      const usernameKey =
        selectedProvider === "github"
          ? localStorage.getItem("github_username")
          : localStorage.getItem("bitbucket_username");

      setSelectedRepo("");
      setSelectedRepoUrl("");
      setSelectedBranch("");
      setBranches([]);
      setLoadingRepos(true);

      // Check if username exists before making API call
      if (!usernameKey) {
        setRepos([]);
        setLoadingRepos(false);
        // Clear previous snackbar state first, then set new error message
        setSnackbarStatus(null);
        setSnackbarMessage(null);
        // Use setTimeout to ensure the snackbar shows the new message
        setTimeout(() => {
          setSnackbarStatus("error");
          setSnackbarMessage(
            `Please connect your ${selectedProvider} account first.`
          );
        }, 100);
        return;
      }

      // Clear any previous error messages when username exists
      setSnackbarStatus(null);
      setSnackbarMessage(null);

      try {
        const res = await fetchRepos(usernameKey, selectedProvider);
        setRepos(res);
      } catch (err) {
        setRepos([]);
        setSnackbarStatus("error");
        setSnackbarMessage(
          err.detail || err.message || "Failed to fetch repositories"
        );
      } finally {
        setLoadingRepos(false);
      }
    };

    loadRepos();
  }, [selectedProvider]);

  // Fetch branches when repo changes
  useEffect(() => {
    const loadBranches = async () => {
      if (!selectedRepo) return;

      const usernameKey =
        selectedProvider === "github"
          ? localStorage.getItem("github_username")
          : localStorage.getItem("bitbucket_username");

      // Check if username exists before making API call
      if (!usernameKey) {
        setBranches([]);
        setSnackbarStatus("error");
        setSnackbarMessage(
          `Please connect your ${selectedProvider} account first.`
        );
        return;
      }

      setLoadingBranches(true);

      try {
        const branchesData = await fetchBranches(
          selectedRepo,
          selectedProvider,
          usernameKey
        );
        setBranches(branchesData.branches);
      } catch (err) {
        setBranches([]);
        setSnackbarStatus("error");
        setSnackbarMessage(err.message || "Failed to fetch branches");
      } finally {
        setLoadingBranches(false);
      }
    };

    loadBranches();
  }, [selectedRepo]);

  // Trigger scan
  const handleSonarScan = async () => {
    setIsScanning(true);
    setSnackbarMessage(null);
    setSnackbarStatus(null);

    try {
      const usernameKey =
        selectedProvider === "github" ? "github_username" : "bitbucket_username";

      const username = localStorage.getItem(usernameKey);

      if (!username) {
        setSnackbarStatus("error");
        setSnackbarMessage(
          `Missing ${selectedProvider} credentials. Please authenticate first.`
        );
        return;
      }

      const payload = {
        repoUrl: selectedRepoUrl,
        repo_username: username,
        userId,
        repo_provider: selectedProvider,
        branch: selectedBranch,
        organization,
      };

      const result = await RepoApiService.triggerScan(payload);

      const startedProjectKey = result?.data?.projectKey;
      if (startedProjectKey) {
        try {
          localStorage.setItem('activeScanProjectKey', startedProjectKey);
        } catch (_) {}
      }

      setSnackbarStatus("success");
      setSnackbarMessage(
        result.data.message ||
          `Scan started successfully. Project Key: ${result.data.projectKey}`
      );

      if (startedProjectKey) {
        setTimeout(() => {
          window.location.assign(`/report-list?activeProjectKey=${encodeURIComponent(startedProjectKey)}`);
        }, 600);
      }
    } catch (error) {
      setSnackbarStatus("error");
      setSnackbarMessage(
        error.response?.data?.message ||
          "Failed to start scan. Please try again."
      );
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="repo-page-container">
      <div className="repo-selection-section">
        <Typography variant="h5" gutterBottom>
          Select a Repository and Branch
        </Typography>

        {/* Provider buttons */}
        <div className="repo-provider-buttons">
          <Button
            variant="contained"
            className={`repo-provider-btn github-black ${
              selectedProvider === "github" ? "active" : ""
            }`}
            startIcon={<GitHubIcon />}
            onClick={() => setSelectedProvider("github")}
          >
            GitHub
          </Button>

          <Button
            variant="contained"
            className={`repo-provider-btn bitbucket-blue ${
              selectedProvider === "bitbucket" ? "active" : ""
            }`}
            startIcon={
              <img
                src="/bitbucket-logo.jpg"
                alt="Bitbucket"
                className="repo-provider-icon"
              />
            }
            onClick={() => setSelectedProvider("bitbucket")}
          >
            Bitbucket
          </Button>
        </div>

        {/* Repo and Branch dropdowns */}
        <div className="repo-selection-grid">
          <div className="select-half">
            <FormControl className="dropdown-select" fullWidth>
              <InputLabel id="repo-select-label">Repository</InputLabel>
              <Select
                labelId="repo-select-label"
                value={selectedRepo}
                onChange={(e) => {
                  const selectedFullName = e.target.value;
                  const selectedRepoObj = repos.find(
                    (repo) => repo.fullName === selectedFullName
                  );

                  setSelectedRepo(selectedFullName);
                  setSelectedRepoUrl(`${selectedRepoObj.url}.git`);
                  setSelectedBranch("");
                  setBranches([]);
                }}
                label="Repository"
              >
                {loadingRepos ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} className="dropdown-loader" />
                    <span className="loader-text">Loading Repositories...</span>
                  </MenuItem>
                ) : (
                  repos.map((repo) => (
                    <MenuItem key={repo.id} value={repo.fullName}>
                      {repo.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </div>

          <div className="select-half">
            <FormControl
              className="dropdown-select"
              fullWidth
              disabled={!selectedRepo}
            >
              <InputLabel id="branch-select-label">Branch</InputLabel>
              <Select
                labelId="branch-select-label"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                label="Branch"
              >
                {loadingBranches ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} className="dropdown-loader" />
                    <span className="loader-text">Loading Branches...</span>
                  </MenuItem>
                ) : (
                  branches.map((branch) => (
                    <MenuItem key={branch} value={branch}>
                      {branch}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </div>
        </div>

        {/* Action button */}
        <div className="repo-action-grid">
          <div className="action-half">
            <Button
              variant="contained"
              className="action-button sonar-button"
              fullWidth
              disabled={!selectedRepo || !selectedBranch || isScanning}
              startIcon={
                isScanning ? (
                  <CircularProgress size={20} color="inherit" />
                ) : null
              }
              onClick={handleSonarScan}
            >
              {isScanning ? "Starting scan..." : "Sonar Scan"}
            </Button>
          </div>
        </div>
      </div>

      {/* Snackbar */}
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
    </div>
  );
};

export default ScanRepo;
