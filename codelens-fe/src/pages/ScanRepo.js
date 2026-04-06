import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { fetchBranches, fetchRepos } from "../utils/Helpers";
import RepoApiService from "../services/RepoApiService";
import SnackbarNotification, {
  SNACKBAR_THEME,
} from "../components/common/SnackbarNotification";
import { Button } from "../components/ui/button";
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
    <div className="repo-page-container p-6">
      <div className="repo-selection-section max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          Select a Repository and Branch
        </h1>

        {/* Provider buttons */}
        <div className="repo-provider-buttons flex gap-4 mb-6">
          <Button
            variant={selectedProvider === "github" ? "default" : "outline"}
            className="gap-2"
            onClick={() => setSelectedProvider("github")}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GitHub
          </Button>

          <Button
            variant={selectedProvider === "bitbucket" ? "default" : "outline"}
            className="gap-2"
            onClick={() => setSelectedProvider("bitbucket")}
          >
            <img
              src="/bitbucket-logo.jpg"
              alt="Bitbucket"
              className="h-4 w-4"
            />
            Bitbucket
          </Button>
        </div>

        {/* Repo and Branch dropdowns */}
        <div className="repo-selection-grid grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="select-half">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Repository
            </label>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedRepo}
              onChange={(e) => {
                const selectedFullName = e.target.value;
                const selectedRepoObj = repos.find(
                  (repo) => repo.fullName === selectedFullName
                );

                setSelectedRepo(selectedFullName);
                setSelectedRepoUrl(`${selectedRepoObj?.url}.git`);
                setSelectedBranch("");
                setBranches([]);
              }}
            >
              <option value="">Select a repository</option>
              {loadingRepos ? (
                <option disabled>Loading repositories...</option>
              ) : (
                repos.map((repo) => (
                  <option key={repo.id} value={repo.fullName}>
                    {repo.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="select-half">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Branch
            </label>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              disabled={!selectedRepo}
            >
              <option value="">Select a branch</option>
              {loadingBranches ? (
                <option disabled>Loading branches...</option>
              ) : (
                branches.map((branch) => (
                  <option key={branch} value={branch}>
                    {branch}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Action button */}
        <div className="repo-action-grid">
          <Button
            className="w-full md:w-auto"
            size="lg"
            disabled={!selectedRepo || !selectedBranch || isScanning}
            onClick={handleSonarScan}
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting scan...
              </>
            ) : (
              "Sonar Scan"
            )}
          </Button>
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
