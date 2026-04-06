import React, { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CredentialsApiService from "../../services/CredentialsApiService";
import BusyBackdrop from "../common/BusyBackdrop";
import { fetchRepos } from "../../utils/Helpers";

const Box = ({ children, className = "" }) => <div className={className}>{children}</div>;
const Typography = ({ children, className = "", variant }) => {
  const classes = variant === "h6" ? "text-lg font-semibold" : "text-sm";
  return <p className={`${classes} ${className}`}>{children}</p>;
};

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

  if (!open) return null;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="terraform-modal relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <button
          aria-label="Close terraform plan dialog"
          className="terraform-close-btn absolute right-2 top-2 rounded p-1 hover:bg-slate-100"
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <Typography variant="h6" className="terraform-modal-title mb-2">
          Run Terraform Plan
        </Typography>
        <Typography className="terraform-modal-subtext mb-4 text-slate-500">
          Select an AWS Account and GitHub repo URL to run the Terraform plan.
        </Typography>

        <Box className="terraform-form-field mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Repository</label>
          <select
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            value={selectedRepoFullName || ""}
            onChange={(e) => {
              const fullName = e.target.value;
              const repoObj = reposData.find((r) => r.fullName === fullName);
              setSelectedRepoFullName(fullName);
              if (repoObj?.url) setrepoUrl(repoObj.url);
              else if (fullName) setrepoUrl(`https://github.com/${fullName}`);
            }}
          >
            <option value="">Select a repository</option>
            {loadingRepos ? (
              <option disabled>
                <Loader2 className="inline h-4 w-4 animate-spin" /> Loading Repositories...
              </option>
            ) : (
              reposData.map((repo) => (
                <option key={repo.id || repo.fullName} value={repo.fullName}>
                  {repo.name || repo.fullName.split('/').pop()}
                </option>
              ))
            )}
          </select>
        </Box>

        <Box className="terraform-form-field mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Select Account ID</label>
          <select
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            value={userAccountId}
            onChange={handleAccountSelect}
          >
            <option value="">Select an account</option>
            {accountOptions.map((opt) => (
              <option key={opt.accountId} value={opt.accountId}>
                {opt?.name ? `${opt.accountId}-${opt.name}` : opt.accountId}
              </option>
            ))}
            <option value="add-new">+ Add New AWS Account</option>
          </select>
        </Box>

        <Box className="terraform-modal-actions flex justify-end gap-2">
          <button
            className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Running..." : "Run Plan"}
          </button>
        </Box>
      </div>
    </div>
    <BusyBackdrop open={submitting} text="Running Terraform plan..." />
    </>
  );
};

export default TerraformPlanModal;
