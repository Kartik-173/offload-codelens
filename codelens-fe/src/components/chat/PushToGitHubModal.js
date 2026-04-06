import React, { useEffect, useState } from "react";
import { X, Package, GitBranch, FileText, Eye, Loader2 } from "lucide-react";
import { fetchRepos, fetchBranches } from "../../utils/Helpers";

const Box = ({ children, className = "" }) => <div className={className}>{children}</div>;
const Typography = ({ children, className = "" }) => <p className={className}>{children}</p>;
const Divider = () => <hr className="my-4 border-slate-200" />;

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="push-modal relative w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <button
          aria-label="Close push dialog"
          className="push-close-btn absolute right-2 top-2 rounded p-1 hover:bg-slate-100"
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <h3 className="push-modal-title mb-1 text-lg font-semibold">Push To GitHub</h3>
        <p className="push-modal-subtext mb-4 text-sm text-slate-500">Provide the required GitHub details to push the code.</p>

        <Divider />

        <div className="push-form-field mb-4">
          <label className="push-label mb-1 flex items-center gap-1 text-sm font-medium">
            <Package size={16} /> Repo Name <span className="req text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              list="repo-options"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Select or type new repo name"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
            />
            <datalist id="repo-options">
              {repoOptions.map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
            {loadingRepos && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-400" />}
            {fetchError && <p className="mt-1 text-xs text-red-500">{fetchError}</p>}
            {formTouched && !repoName && <p className="mt-1 text-xs text-red-500">Repository name is required</p>}
          </div>
        </div>

        <div className="push-form-field mb-4">
          <label className="push-label mb-1 flex items-center gap-1 text-sm font-medium">
            <GitBranch size={16} /> Branch <span className="req text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              list="branch-options"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="Select or type branch name"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            />
            <datalist id="branch-options">
              {branchOptions.map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
            {loadingBranches && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-slate-400" />}
            {branchError && <p className="mt-1 text-xs text-red-500">{branchError}</p>}
            {formTouched && !branch && <p className="mt-1 text-xs text-red-500">Branch name is required</p>}
            {formTouched && /\s/.test(branch) && <p className="mt-1 text-xs text-red-500">No spaces allowed in branch name</p>}
          </div>
        </div>

        <div className="push-form-field mb-4">
          <label className="push-label mb-1 flex items-center gap-1 text-sm font-medium">
            <FileText size={16} /> Description
          </label>
          <input
            type="text"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="push-form-field mb-4">
          <label className="push-label mb-1 flex items-center gap-1 text-sm font-medium">
            <Eye size={16} /> Visibility
          </label>
          <select
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>

        <div className="push-modal-actions flex justify-end gap-2">
          <button className="push-cancel rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={onClose}>Cancel</button>
          <button
            className="push-submit rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            onClick={handlePush}
            disabled={!repoName || !branch || /\s/.test(branch)}
          >
            Push
          </button>
        </div>
      </div>
    </div>
  );
};

export default PushToGitHubModal;
