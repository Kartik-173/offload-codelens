import React, { useEffect, useState } from "react";
import { Loader2, Check } from "lucide-react";

import SnackbarNotification, {
  SNACKBAR_THEME,
} from "../components/common/SnackbarNotification";
import GithubApiService from "../services/GithubApiService";
import { ENV } from '../config/env';

// --- Simple Step Icon Component ---
function GithubStepIcon({ active, completed, icon }) {
  const classNames = [
    "github-step-icon w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
    active ? "bg-blue-600 text-white" : "",
    completed ? "bg-green-500 text-white" : "bg-slate-200 text-slate-600",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames}>
      {completed ? <Check className="w-4 h-4" /> : icon}
    </div>
  );
}

const GITHUB_STEPS = [
  {
    title: "Go to GitHub → Settings",
    description: "Use the top-right avatar menu to open your personal settings.",
  },
  {
    title: "Open Developer settings → OAuth Apps",
    description: "You’ll find this on the left sidebar in GitHub settings.",
  },
  {
    title: "Click “New OAuth App”",
    description: "You’ll be creating a new OAuth App for this workspace.",
  },
  {
    title: "Enter Application name, Homepage URL, Authorization callback URL",
    description:
      "We’ll use the callback URL to securely connect GitHub with this workspace.",
  },
  {
    title: "Copy the Client ID",
    description: "You’ll paste this into the form here.",
  },
  {
    title: "Generate a new Client Secret",
    description: "Copy the generated secret immediately — GitHub hides it.",
  },
  {
    title: "Paste Client ID & Client Secret",
    description:
      "Add both values to the form on this page and save the configuration.",
  },
];

const GitHubConnections = () => {
  const [snackbarStatus, setSnackbarStatus] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState(null);
  const [githubUser, setGithubUser] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [hasOrgOAuthConfig, setHasOrgOAuthConfig] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);

  const oauthKey = ENV.GITHUB_OAUTH_NAME;

  useEffect(() => {
    const storedUsername = localStorage.getItem("github_username");
    const storedAvatar = localStorage.getItem("github_avatar_url");

    if (storedUsername && storedAvatar) {
      setGithubUser({
        login: storedUsername,
        github_avatar_url: storedAvatar,
      });
    }
  }, []);

  useEffect(() => {
    const loadConfig = async () => {
      if (!oauthKey) {
        setLoadingConfig(false);
        return;
      }

      try {
        const res = await GithubApiService.fetchGithubOAuthStatus(oauthKey);
        setHasOrgOAuthConfig(Boolean(res?.exists));
      } catch (error) {
        setSnackbarStatus("error");
        setSnackbarMessage(
          "Failed to check GitHub OAuth configuration. Please try again."
        );
      } finally {
        setLoadingConfig(false);
      }
    };

    loadConfig();
  }, [oauthKey]);

  const handleGithubLogin = () => {
    const authUrl = GithubApiService.getGithubAuthUrl();
    window.location.href = authUrl;
  };

  const handleSaveOAuthConfig = async (e) => {
    e.preventDefault();

    if (!clientId || !clientSecret) {
      setSnackbarStatus("error");
      setSnackbarMessage("Please provide both Client ID and Client Secret.");
      return;
    }

    setSavingConfig(true);
    setSnackbarStatus(null);
    setSnackbarMessage(null);

    try {
      await GithubApiService.saveGithubOAuthConfig({
        organization: oauthKey,
        clientId,
        clientSecret,
      });

      setHasOrgOAuthConfig(true);
      setClientId("");
      setClientSecret("");
      setSnackbarStatus("success");
      setSnackbarMessage("GitHub OAuth app configuration saved successfully.");
    } catch (error) {
      setSnackbarStatus("error");
      setSnackbarMessage(
        error?.response?.data?.message ||
          "Failed to save GitHub OAuth configuration. Please try again."
      );
    } finally {
      setSavingConfig(false);
    }
  };

  const handleRemoveAccount = async (githubUsername) => {
    try {
      await GithubApiService.logoutGithub(githubUsername);

      localStorage.removeItem("github_username");
      localStorage.removeItem("github_avatar_url");
      setGithubUser(null);
      setSnackbarStatus("success");
      setSnackbarMessage("GitHub account removed successfully.");
    } catch (error) {
      setSnackbarStatus("error");
      setSnackbarMessage("Failed to remove GitHub account.");
    }
  };

  return (
    <div className="github-page-container p-6">
      <div className="github-accounts-section max-w-6xl mx-auto">
        {/* Header */}
        <div className="github-header mb-6">
          <h2 className="text-2xl font-bold text-slate-900">GitHub Connections</h2>
        </div>

        {/* Subtitle only when OAuth is NOT configured */}
        {!hasOrgOAuthConfig && (
          <p className="github-header-subtext text-slate-600 mb-6">
            Configure a workspace-wide OAuth app and let your team connect their
            GitHub accounts in a single click.
          </p>
        )}

        {/* ===== CONFIG AREA ===== */}

        {/* While we don't know yet, show small "checking" hero */}
        {loadingConfig && (
          <div className="github-hero bg-white rounded-lg shadow p-6 mb-6 flex items-center gap-4">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <div>
              <div className="hero-title font-medium text-slate-900">
                Checking GitHub OAuth configuration…
              </div>
              <div className="hero-subtext text-sm text-slate-600">
                We're verifying if this workspace already has an OAuth app
                configured.
              </div>
            </div>
          </div>
        )}

        {/* OAuth NOT configured → show full setup (steps + form) */}
        {!loadingConfig && !hasOrgOAuthConfig && (
          <div className="github-setup-card bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="github-setup-layout grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT: steps */}
              <div className="github-setup-steps">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Step-by-step guide
                </p>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Set up a GitHub OAuth app
                </h3>
                <p className="text-sm text-slate-600 mb-6">
                  Follow these steps in GitHub, then paste your credentials
                  into the form.
                </p>

                <div className="github-stepper-wrapper space-y-4">
                  {GITHUB_STEPS.map((step, idx) => (
                    <div key={step.title} className="flex gap-4">
                      <GithubStepIcon
                        icon={<span className="text-sm">{idx + 1}</span>}
                        active={false}
                        completed={false}
                      />
                      <div className="github-step-label-content">
                        <p className="github-step-title text-sm font-medium text-slate-900">
                          {step.title}
                        </p>
                        <p className="github-step-description text-xs text-slate-600">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: form */}
              <div className="github-setup-form">
                <div className="github-form-card bg-slate-50 rounded-lg p-6">
                  <div className="github-form-header flex items-center gap-3 mb-6">
                    <div className="github-form-avatar w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="github-form-title font-medium text-slate-900">
                        Configure GitHub OAuth app
                      </div>
                      <div className="github-form-subtitle text-xs text-slate-600">
                        Paste the generated Client ID and Client Secret from
                        GitHub.
                      </div>
                    </div>
                  </div>

                  <form
                    className="github-oauth-form space-y-4"
                    autoComplete="off"
                    onSubmit={handleSaveOAuthConfig}
                  >
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        GitHub Client ID
                      </label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        disabled={savingConfig}
                        placeholder="Enter Client ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        GitHub Client Secret
                      </label>
                      <input
                        type="password"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                        disabled={savingConfig}
                        placeholder="Enter Client Secret"
                      />
                    </div>

                    <div className="github-form-footer flex items-center justify-between pt-4">
                      <span className="github-form-footnote text-xs text-slate-500">
                        These values are encrypted and stored securely for
                        this workspace only.
                      </span>
                      <button
                        type="submit"
                        disabled={savingConfig}
                        className="github-save-button px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {savingConfig ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          "Save GitHub OAuth App"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== PERSONAL ACCOUNT AREA (only when OAuth exists) ===== */}
        {hasOrgOAuthConfig && !loadingConfig && (
          <div className="github-personal-section bg-white rounded-lg shadow p-6">
            <div className="github-personal-header flex items-center justify-between mb-6">
              <div>
                <h3 className="github-personal-title text-lg font-semibold text-slate-900">
                  Personal GitHub connection
                </h3>
                <p className="github-personal-subtitle text-sm text-slate-600">
                  Connect your own GitHub account to enable repository scans
                  and insights.
                </p>
              </div>
              <button
                onClick={
                  !githubUser
                    ? handleGithubLogin
                    : () => handleRemoveAccount(githubUser.login)
                }
                className={`github-add-button px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                  githubUser
                    ? "border border-slate-300 text-slate-700 hover:bg-slate-50"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                {githubUser ? "Logout GitHub" : "Connect GitHub"}
              </button>
            </div>

            {githubUser ? (
              <div className="github-personal-card bg-slate-50 rounded-lg p-4 flex items-center justify-between">
                <div className="github-personal-info flex items-center gap-3">
                  <img
                    src={githubUser.github_avatar_url}
                    alt={githubUser.login}
                    className="github-user-avatar w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="github-username font-medium text-slate-900">
                      {githubUser.login}
                    </div>
                    <div className="github-personal-status text-sm text-slate-600">
                      Connected to GitHub
                    </div>
                  </div>
                </div>
                <button
                  className="github-remove-button px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md"
                  onClick={() => handleRemoveAccount(githubUser.login)}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="github-empty text-center py-8 bg-slate-50 rounded-lg">
                <div className="empty-title font-medium text-slate-900 mb-1">
                  No GitHub account connected
                </div>
                <div className="empty-sub text-sm text-slate-600">
                  Click <strong>Connect GitHub</strong> above to link your
                  account.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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

export default GitHubConnections;
