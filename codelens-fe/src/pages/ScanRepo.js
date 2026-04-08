import React, { useEffect, useState } from "react";
import { Loader2, Scan, GitBranch, GitFork, Shield, Info, AlertCircle } from "lucide-react";
import { fetchBranches, fetchRepos } from "../utils/Helpers";
import RepoApiService from "../services/RepoApiService";
import { useToast } from "../components/common/ToastProvider";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ENV } from '../config/env';

const ScanRepo = () => {
  const { success, error } = useToast();
  const [repos, setRepos] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [selectedRepoUrl, setSelectedRepoUrl] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
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
        error(`Please connect your ${selectedProvider} account first.`);
        return;
      }

      try {
        const res = await fetchRepos(usernameKey, selectedProvider);
        setRepos(res);
      } catch (err) {
        setRepos([]);
        error(err.detail || err.message || "Failed to fetch repositories");
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
        error(`Please connect your ${selectedProvider} account first.`);
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
        error(err.message || "Failed to fetch branches");
      } finally {
        setLoadingBranches(false);
      }
    };

    loadBranches();
  }, [selectedRepo]);

  // Trigger scan
  const handleSonarScan = async () => {
    setIsScanning(true);

    try {
      const usernameKey =
        selectedProvider === "github" ? "github_username" : "bitbucket_username";

      const username = localStorage.getItem(usernameKey);

      if (!username) {
        error(`Missing ${selectedProvider} credentials. Please authenticate first.`);
        setIsScanning(false);
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

      success(
        result.data.message ||
          `Scan started successfully. Project Key: ${result.data.projectKey}`
      );

      if (startedProjectKey) {
        setTimeout(() => {
          window.location.assign(`/report-list?activeProjectKey=${encodeURIComponent(startedProjectKey)}`);
        }, 600);
      }
    } catch (err) {
      error(
        err.response?.data?.message ||
          "Failed to start scan. Please try again."
      );
    } finally {
      setIsScanning(false);
    }
  };

  const isConnected = selectedProvider === "github"
    ? localStorage.getItem("github_username")
    : localStorage.getItem("bitbucket_username");

  return (
    <div className="bg-gray-50 p-6 min-h-full">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Scan className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Repository Scan</h1>
              <p className="text-gray-500">Analyze your codebase for security vulnerabilities and quality issues</p>
            </div>
          </div>
        </div>

        {/* Provider Selection Card */}
        <Card className="mb-6 border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <GitFork className="h-5 w-5 text-blue-500" />
              Select Provider
            </CardTitle>
            <CardDescription>Choose your Git hosting provider</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedProvider("github")}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedProvider === "github"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                }`}
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span className="font-semibold">GitHub</span>
                {selectedProvider === "github" && (
                  <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">Selected</Badge>
                )}
              </button>

              <button
                onClick={() => setSelectedProvider("bitbucket")}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedProvider === "bitbucket"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                }`}
              >
                <img
                  src="/bitbucket-logo.jpg"
                  alt="Bitbucket"
                  className="h-6 w-6 rounded"
                />
                <span className="font-semibold">Bitbucket</span>
                {selectedProvider === "bitbucket" && (
                  <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">Selected</Badge>
                )}
              </button>
            </div>

            {!isConnected && (
              <div className="mt-4 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800 font-medium">Account Not Connected</p>
                  <p className="text-sm text-amber-600 mt-1">
                    Please connect your {selectedProvider} account to scan repositories.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Repository & Branch Selection Card */}
        <Card className="mb-6 border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-purple-500" />
              Select Repository & Branch
            </CardTitle>
            <CardDescription>Choose the repository and branch to scan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Repository Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Repository
                  {loadingRepos && <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin" />}
                </label>
                <div className="relative">
                  <select
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    value={selectedRepo}
                    disabled={!isConnected || loadingRepos}
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
                    <option value="">{isConnected ? "Select a repository" : "Connect account first"}</option>
                    {repos.map((repo) => (
                      <option key={repo.id} value={repo.fullName}>
                        {repo.name}
                      </option>
                    ))}
                  </select>
                </div>
                {isConnected && repos.length === 0 && !loadingRepos && (
                  <p className="mt-2 text-sm text-gray-500">No repositories found</p>
                )}
              </div>

              {/* Branch Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Branch
                  {loadingBranches && <Loader2 className="inline-block ml-2 h-4 w-4 animate-spin" />}
                </label>
                <div className="relative">
                  <select
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    disabled={!selectedRepo || loadingBranches}
                  >
                    <option value="">{selectedRepo ? "Select a branch" : "Select repository first"}</option>
                    {branches.map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scan Action Card */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-800">Ready to Scan</p>
                  <p className="text-sm text-gray-500">
                    {selectedRepo && selectedBranch
                      ? `Scanning ${selectedRepo} (${selectedBranch} branch)`
                      : "Please select both repository and branch to proceed"}
                  </p>
                </div>
              </div>

              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 shadow-lg"
                disabled={!selectedRepo || !selectedBranch || isScanning || !isConnected}
                onClick={handleSonarScan}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Starting Scan...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-5 w-5" />
                    Start Sonar Scan
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 border-0 shadow-sm bg-gradient-to-r from-slate-50 to-gray-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">What happens during a scan?</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Code is analyzed for security vulnerabilities and bugs</li>
                  <li>• Quality metrics are calculated (code smells, duplications)</li>
                  <li>• Test coverage and complexity are measured</li>
                  <li>• Results are stored and available in the Reports section</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScanRepo;
