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
import CheckIcon from "@mui/icons-material/Check";

import SnackbarNotification, {
  SNACKBAR_THEME,
} from "../components/common/SnackbarNotification";
import BitbucketApiService from "../services/BitbucketApiService";
import { ENV } from '../config/env';

function BitbucketStepIcon(props) {
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
  const [snackbarStatus, setSnackbarStatus] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState(null);
  const [bitbucketUser, setBitbucketUser] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [hasOrgOAuthConfig, setHasOrgOAuthConfig] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);

  const oauthKey = ENV.BITBUCKET_OAUTH_NAME;

  const theme = useTheme();
  const isNarrow = useMediaQuery("(max-width: 900px)");

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
        setSnackbarStatus("error");
        setSnackbarMessage(
          "Failed to check Bitbucket OAuth configuration. Please try again."
        );
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
      setSnackbarStatus("error");
      setSnackbarMessage("Please provide both Client ID and Client Secret.");
      return;
    }

    setSavingConfig(true);
    setSnackbarStatus(null);
    setSnackbarMessage(null);

    try {
      await BitbucketApiService.saveBitbucketOAuthConfig({
        organization: oauthKey,
        clientId,
        clientSecret,
      });

      setHasOrgOAuthConfig(true);
      setClientId("");
      setClientSecret("");
      setSnackbarStatus("success");
      setSnackbarMessage(
        "Bitbucket OAuth app configuration saved successfully."
      );
    } catch (error) {
      setSnackbarStatus("error");
      setSnackbarMessage(
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
      setSnackbarStatus("success");
      setSnackbarMessage("Bitbucket account removed successfully.");
    } catch (error) {
      setSnackbarStatus("error");
      setSnackbarMessage("Failed to remove Bitbucket account.");
    }
  };

  return (
    <div className="bitbucket-page-container">
      <div className="bitbucket-accounts-section">
        <div className="bitbucket-header">
          <h2>Bitbucket Connections</h2>
        </div>

        {!hasOrgOAuthConfig && (
          <p className="github-header-subtext">
            Configure a workspace-wide Bitbucket OAuth app and let your team
            connect their Bitbucket accounts in a single click.
          </p>
        )}

        {loadingConfig && (
          <Fade in timeout={400}>
            <Card elevation={1} className="bitbucket-hero">
              <CardContent className="github-hero-content">
                <CircularProgress size={20} />
                <div>
                  <div className="hero-title">
                    Checking Bitbucket OAuth configuration...
                  </div>
                  <div className="hero-subtext">
                    We're verifying if this workspace already has an OAuth app
                    configured.
                  </div>
                </div>
              </CardContent>
            </Card>
          </Fade>
        )}

        {!loadingConfig && !hasOrgOAuthConfig && (
          <Fade in timeout={400}>
            <Card elevation={2} className="github-setup-card">
              <CardContent>
                <div className="github-setup-layout">
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
                      Set up a Bitbucket OAuth app
                    </Typography>
                    <Typography
                      variant="body2"
                      className="github-steps-subtext"
                    >
                      Follow these steps in Bitbucket, then paste your
                      credentials into the form.
                    </Typography>

                    <div className="github-stepper-wrapper">
                      <Stepper
                        orientation={isNarrow ? "horizontal" : "vertical"}
                        alternativeLabel={isNarrow}
                        activeStep={BITBUCKET_STEPS.length}
                        nonLinear
                        connector={null}
                        className="github-stepper"
                      >
                        {BITBUCKET_STEPS.map((step) => (
                          <Step key={step.title}>
                            <StepLabel StepIconComponent={BitbucketStepIcon}>
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

                  <div className="github-setup-form">
                    <div className="github-form-card">
                      <div className="github-form-header">
                        <Avatar className="github-form-avatar" sx={{ bgcolor: "#078b40" }}>
                          B
                        </Avatar>
                        <div>
                          <div className="github-form-title">
                            Configure Bitbucket OAuth app
                          </div>
                          <div className="github-form-subtitle">
                            Paste the generated Client ID and Client Secret from
                            Bitbucket.
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
                          label="Bitbucket Client ID"
                          variant="outlined"
                          size="small"
                          value={clientId}
                          onChange={(e) => setClientId(e.target.value)}
                          disabled={savingConfig}
                        />
                        <TextField
                          fullWidth
                          label="Bitbucket Client Secret"
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
                                Saving...
                              </>
                            ) : (
                              "Save Bitbucket OAuth App"
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

        {hasOrgOAuthConfig && !loadingConfig && (
          <Fade in timeout={400}>
            <div className="github-personal-section" style={{ width: "100%" }}>
              <div className="github-personal-header">
                <div>
                  <Typography variant="h6" className="github-personal-title">
                    Personal Bitbucket connection
                  </Typography>
                  <Typography
                    variant="body2"
                    className="github-personal-subtitle"
                  >
                    Connect your own Bitbucket account to enable repository
                    scans and insights.
                  </Typography>
                </div>
                <div className="bitbucket-toolbar">
                  <Button
                    className="bitbucket-add-button"
                    startIcon={
                      <img
                        src="/bitbucket-logo.jpg"
                        alt="Bitbucket"
                        className="bitbucket-icon-img"
                      />
                    }
                    onClick={
                      !bitbucketUser
                        ? handleBitbucketLogin
                        : () => handleRemoveAccount(bitbucketUser.username)
                    }
                  >
                    {bitbucketUser ? "Logout Bitbucket" : "Connect Bitbucket"}
                  </Button>
                </div>
              </div>

              {bitbucketUser ? (
                <div className="github-personal-card">
                  <div className="github-personal-info">
                    <Avatar
                      src={bitbucketUser.avatar_url}
                      alt={bitbucketUser.username}
                      className="github-user-avatar"
                    />
                    <div>
                      <div className="github-username">
                        {bitbucketUser.username}
                      </div>
                      <div className="github-personal-status">
                        Connected to Bitbucket
                      </div>
                    </div>
                  </div>
                  <button
                    className="github-remove-button"
                    onClick={() => handleRemoveAccount(bitbucketUser.username)}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="github-empty">
                  <div className="empty-title">
                    No Bitbucket account connected
                  </div>
                  <div className="empty-sub">
                    Click <strong>Connect Bitbucket</strong> above to link your
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

export default BitbucketConnections;
