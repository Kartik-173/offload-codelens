import React, { useEffect, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Fade,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import CheckIcon from "@mui/icons-material/Check";

import SnackbarNotification, {
  SNACKBAR_THEME,
} from "../components/common/SnackbarNotification";
import GithubApiService from "../services/GithubApiService";
import { ENV } from '../config/env';

// --- Custom Step Icon using CSS classes (no inline styling) ---
function GithubStepIcon(props) {
  const { active, completed, icon } = props;

  const classNames = [
    "github-step-icon",
    active ? "github-step-icon-active" : "",
    completed ? "github-step-icon-completed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames}>
      {completed ? <CheckIcon fontSize="small" /> : icon}
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

  const theme = useTheme();
  const isNarrow = useMediaQuery("(max-width: 900px)");

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
    <div className="github-page-container">
      <div className="github-accounts-section">
        {/* Header */}
        <div className="github-header">
          <h2>GitHub Connections</h2>
        </div>

        {/* Subtitle only when OAuth is NOT configured */}
        {!hasOrgOAuthConfig && (
          <p className="github-header-subtext">
            Configure a workspace-wide OAuth app and let your team connect their
            GitHub accounts in a single click.
          </p>
        )}

        {/* ===== CONFIG AREA ===== */}

        {/* While we don't know yet, show small "checking" hero */}
        {loadingConfig && (
          <Fade in timeout={400}>
            <Card elevation={1} className="github-hero">
              <CardContent className="github-hero-content">
                <CircularProgress size={20} />
                <div>
                  <div className="hero-title">
                    Checking GitHub OAuth configuration…
                  </div>
                  <div className="hero-subtext">
                    We’re verifying if this workspace already has an OAuth app
                    configured.
                  </div>
                </div>
              </CardContent>
            </Card>
          </Fade>
        )}

        {/* OAuth NOT configured → show full setup (steps + form) */}
        {!loadingConfig && !hasOrgOAuthConfig && (
          <Fade in timeout={400}>
            <Card elevation={2} className="github-setup-card">
              <CardContent>
                <div className="github-setup-layout">
                  {/* LEFT: steps */}
                  <div className="github-setup-steps">
                    <Typography
                      variant="overline"
                      className="github-steps-overline"
                    >
                      Step-by-step guide
                    </Typography>
                    <Typography
                      variant="h6"
                      className="github-steps-title"
                      gutterBottom
                    >
                      Set up a GitHub OAuth app
                    </Typography>
                    <Typography
                      variant="body2"
                      className="github-steps-subtext"
                    >
                      Follow these steps in GitHub, then paste your credentials
                      into the form.
                    </Typography>

                    <div className="github-stepper-wrapper">
                      <Stepper
                        orientation={isNarrow ? "horizontal" : "vertical"}
                        alternativeLabel={isNarrow}
                        activeStep={GITHUB_STEPS.length}
                        nonLinear
                        connector={null}
                        className="github-stepper"
                      >
                        {GITHUB_STEPS.map((step) => (
                          <Step key={step.title}>
                            <StepLabel StepIconComponent={GithubStepIcon}>
                              <div className="github-step-label-content">
                                <Typography
                                  variant="body2"
                                  className="github-step-title"
                                >
                                  {step.title}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  className="github-step-description"
                                >
                                  {step.description}
                                </Typography>
                              </div>
                            </StepLabel>
                          </Step>
                        ))}
                      </Stepper>
                    </div>
                  </div>

                  {/* RIGHT: form */}
                  <div className="github-setup-form">
                    <div className="github-form-card">
                      <div className="github-form-header">
                        <Avatar className="github-form-avatar">
                          <GitHubIcon />
                        </Avatar>
                        <div>
                          <div className="github-form-title">
                            Configure GitHub OAuth app
                          </div>
                          <div className="github-form-subtitle">
                            Paste the generated Client ID and Client Secret from
                            GitHub.
                          </div>
                        </div>
                      </div>

                      <form
                        className="github-oauth-form"
                        autoComplete="off"
                        onSubmit={handleSaveOAuthConfig}
                      >
                        <TextField
                          fullWidth
                          label="GitHub Client ID"
                          variant="outlined"
                          size="small"
                          value={clientId}
                          onChange={(e) => setClientId(e.target.value)}
                          disabled={savingConfig}
                        />
                        <TextField
                          fullWidth
                          label="GitHub Client Secret"
                          variant="outlined"
                          size="small"
                          type="password"
                          value={clientSecret}
                          onChange={(e) => setClientSecret(e.target.value)}
                          disabled={savingConfig}
                        />

                        <div className="github-form-footer">
                          <span className="github-form-footnote">
                            These values are encrypted and stored securely for
                            this workspace only.
                          </span>
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={savingConfig}
                            className="github-save-button"
                          >
                            {savingConfig ? (
                              <>
                                <CircularProgress
                                  size={18}
                                  className="github-save-spinner"
                                />
                                Saving…
                              </>
                            ) : (
                              "Save GitHub OAuth App"
                            )}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Fade>
        )}

        {/* ===== PERSONAL ACCOUNT AREA (only when OAuth exists) ===== */}
        {hasOrgOAuthConfig && !loadingConfig && (
          <Fade in timeout={400}>
            <div className="github-personal-section">
              <div className="github-personal-header">
                <div>
                  <Typography variant="h6" className="github-personal-title">
                    Personal GitHub connection
                  </Typography>
                  <Typography
                    variant="body2"
                    className="github-personal-subtitle"
                  >
                    Connect your own GitHub account to enable repository scans
                    and insights.
                  </Typography>
                </div>
                <Button
                  variant={githubUser ? "outlined" : "contained"}
                  startIcon={<GitHubIcon />}
                  onClick={
                    !githubUser
                      ? handleGithubLogin
                      : () => handleRemoveAccount(githubUser.login)
                  }
                  className="github-add-button"
                >
                  {githubUser ? "Logout GitHub" : "Connect GitHub"}
                </Button>
              </div>

              {githubUser ? (
                <div className="github-personal-card">
                  <div className="github-personal-info">
                    <Avatar
                      src={githubUser.github_avatar_url}
                      alt={githubUser.login}
                      className="github-user-avatar"
                    />
                    <div>
                      <div className="github-username">
                        {githubUser.login}
                      </div>
                      <div className="github-personal-status">
                        Connected to GitHub
                      </div>
                    </div>
                  </div>
                  <button
                    className="github-remove-button"
                    onClick={() => handleRemoveAccount(githubUser.login)}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="github-empty">
                  <div className="empty-title">
                    No GitHub account connected
                  </div>
                  <div className="empty-sub">
                    Click <strong>Connect GitHub</strong> above to link your
                    account.
                  </div>
                </div>
              )}
            </div>
          </Fade>
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
