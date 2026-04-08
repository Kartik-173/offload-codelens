import React, { useEffect, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { useToast } from "../components/common/ToastProvider";
import BitbucketApiService from "../services/BitbucketApiService";
import { ENV } from '../config/env';

function BitbucketStepIcon({ active, completed, icon }) {
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

const BITBUCKET_STEPS = [
  {
    title: "Open your Bitbucket workspace",
    description:
      "Sign in to Bitbucket Cloud and select the workspace you want to configure.",
  },
  {
    title: "Go to Workspace settings",
    description:
      "Click your workspace avatar (bottom-left) and choose \"Workspace settings\".",
  },
  {
    title: "Open OAuth consumers",
    description:
      "Under \"Access management\", select \"OAuth consumers\".",
  },
  {
    title: "Add a new OAuth consumer",
    description:
      "Click on \"Add consumer\" to create a new OAuth app.",
  },
  {
    title: "Enter name and callback URL",
    description:
      "Only two fields are required: a Name and the Callback URL provided here.",
  },
  {
    title: "Enable required permissions",
    description:
      "Grant Read access for both Account (Email/Identity) and Repositories.",
  },
  {
    title: "Save and copy Key & Secret",
    description:
      "Save the OAuth consumer, then copy the generated Key and Secret and paste them here.",
  },
];


const BitbucketConnections = () => {
  const { success, error } = useToast();
  const [bitbucketUser, setBitbucketUser] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [hasOrgOAuthConfig, setHasOrgOAuthConfig] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);

  const oauthKey = ENV.BITBUCKET_OAUTH_NAME;

  useEffect(() => {
    const storedUsername = localStorage.getItem("bitbucket_username");
    const storedAvatar = localStorage.getItem("bitbucket_avatar_url");

    if (storedUsername && storedAvatar) {
      setBitbucketUser({
        username: storedUsername,
        avatar_url: storedAvatar || "/default-avatar.png",
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
        const res = await BitbucketApiService.fetchBitbucketOAuthStatus(oauthKey);
        setHasOrgOAuthConfig(Boolean(res?.exists));
      } catch (error) {
        error("Failed to check Bitbucket OAuth configuration. Please try again.");
      } finally {
        setLoadingConfig(false);
      }
    };

    loadConfig();
  }, [oauthKey]);

  const handleBitbucketLogin = () => {
    const authUrl = BitbucketApiService.getBitbucketAuthUrl();
    window.location.href = authUrl;
  };

  const handleSaveOAuthConfig = async (e) => {
    e.preventDefault();

    if (!clientId || !clientSecret) {
      error("Please provide both Client ID and Client Secret.");
      return;
    }

    setSavingConfig(true);

    try {
      await BitbucketApiService.saveBitbucketOAuthConfig({
        organization: oauthKey,
        clientId,
        clientSecret,
      });

      setHasOrgOAuthConfig(true);
      setClientId("");
      setClientSecret("");
      success("Bitbucket OAuth app configuration saved successfully.");
    } catch (error) {
      error(
        error?.response?.data?.message ||
          "Failed to save Bitbucket OAuth configuration. Please try again."
      );
    } finally {
      setSavingConfig(false);
    }
  };

  const handleRemoveAccount = async (bitbucketUsername) => {
    try {
      await BitbucketApiService.logoutBitbucket(bitbucketUsername);

      localStorage.removeItem("bitbucket_username");
      localStorage.removeItem("bitbucket_avatar_url");
      localStorage.removeItem("bitbucket_display_name");
      setBitbucketUser(null);
      success("Bitbucket account removed successfully.");
    } catch (error) {
      error("Failed to remove Bitbucket account.");
    }
  };

  return (
    <div className="bitbucket-page-container p-6">
      <div className="bitbucket-accounts-section max-w-6xl mx-auto">
        <div className="bitbucket-header mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Bitbucket Connections</h2>
        </div>

        {!hasOrgOAuthConfig && (
          <p className="github-header-subtext text-slate-600 mb-6">
            Configure a workspace-wide Bitbucket OAuth app and let your team
            connect their Bitbucket accounts in a single click.
          </p>
        )}

        {loadingConfig && (
          <div className="bitbucket-hero bg-white rounded-lg shadow p-6 mb-6 flex items-center gap-4">
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            <div>
              <div className="hero-title font-medium text-slate-900">
                Checking Bitbucket OAuth configuration...
              </div>
              <div className="hero-subtext text-sm text-slate-600">
                We're verifying if this workspace already has an OAuth app
                configured.
              </div>
            </div>
          </div>
        )}

        {!loadingConfig && !hasOrgOAuthConfig && (
          <div className="github-setup-card bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="github-setup-layout grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="github-setup-steps">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Step-by-step guide
                </p>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Set up a Bitbucket OAuth app
                </h3>
                <p className="text-sm text-slate-600 mb-6">
                  Follow these steps in Bitbucket, then paste your
                  credentials into the form.
                </p>

                <div className="github-stepper-wrapper space-y-4">
                  {BITBUCKET_STEPS.map((step, idx) => (
                    <div key={step.title} className="flex gap-4">
                      <BitbucketStepIcon
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

              <div className="github-setup-form">
                <div className="github-form-card bg-slate-50 rounded-lg p-6">
                  <div className="github-form-header flex items-center gap-3 mb-6">
                    <div className="github-form-avatar w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold">
                      B
                    </div>
                    <div>
                      <div className="github-form-title font-medium text-slate-900">
                        Configure Bitbucket OAuth app
                      </div>
                      <div className="github-form-subtitle text-xs text-slate-600">
                        Paste the generated Client ID and Client Secret from
                        Bitbucket.
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
                        Bitbucket Client ID
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
                        Bitbucket Client Secret
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
                            Saving...
                          </>
                        ) : (
                          "Save Bitbucket OAuth App"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {hasOrgOAuthConfig && !loadingConfig && (
          <div className="github-personal-section bg-white rounded-lg shadow p-6">
            <div className="github-personal-header flex items-center justify-between mb-6">
              <div>
                <h3 className="github-personal-title text-lg font-semibold text-slate-900">
                  Personal Bitbucket connection
                </h3>
                <p className="github-personal-subtitle text-sm text-slate-600">
                  Connect your own Bitbucket account to enable repository
                  scans and insights.
                </p>
              </div>
              <button
                onClick={
                  !bitbucketUser
                    ? handleBitbucketLogin
                    : () => handleRemoveAccount(bitbucketUser.username)
                }
                className={`bitbucket-add-button px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                  bitbucketUser
                    ? "border border-slate-300 text-slate-700 hover:bg-slate-50"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <img
                  src="/bitbucket-logo.jpg"
                  alt="Bitbucket"
                  className="bitbucket-icon-img w-4 h-4"
                />
                {bitbucketUser ? "Logout Bitbucket" : "Connect Bitbucket"}
              </button>
            </div>

            {bitbucketUser ? (
              <div className="github-personal-card bg-slate-50 rounded-lg p-4 flex items-center justify-between">
                <div className="github-personal-info flex items-center gap-3">
                  <img
                    src={bitbucketUser.avatar_url}
                    alt={bitbucketUser.username}
                    className="github-user-avatar w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="github-username font-medium text-slate-900">
                      {bitbucketUser.username}
                    </div>
                    <div className="github-personal-status text-sm text-slate-600">
                      Connected to Bitbucket
                    </div>
                  </div>
                </div>
                <button
                  className="github-remove-button px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md"
                  onClick={() => handleRemoveAccount(bitbucketUser.username)}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="github-empty text-center py-8 bg-slate-50 rounded-lg">
                <div className="empty-title font-medium text-slate-900 mb-1">
                  No Bitbucket account connected
                </div>
                <div className="empty-sub text-sm text-slate-600">
                  Click <strong>Connect Bitbucket</strong> above to link your
                  account.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BitbucketConnections;
