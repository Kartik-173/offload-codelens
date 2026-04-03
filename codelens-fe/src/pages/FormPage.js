import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const FormPage = () => {
  const navigate = useNavigate();
  const [loadingMessage, setLoadingMessage] = useState("Processing login...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const provider = params.get("provider");

    if (!provider) {
      console.error("❌ Missing provider in URL");
      navigate("/signin");
      return;
    }

    if (provider === "github") {
      setLoadingMessage("Processing GitHub login...");
      const githubUsername = params.get("github_username");
      const avatarUrl = params.get("avatar_url");

      if (githubUsername) {
        localStorage.setItem("github_username", githubUsername);
        localStorage.setItem("github_avatar_url", avatarUrl || "");
        navigate("/github-connections");
      } else {
        console.error("❌ Missing GitHub username in query params");
        navigate("/signin");
      }
    }

    if (provider === "bitbucket") {
      setLoadingMessage("Processing Bitbucket login...");
      const bitbucketUsername = params.get("bitbucket_username");
      const displayName = params.get("display_name");
      const avatarUrl = params.get("avatar_url");

      if (bitbucketUsername) {
        localStorage.setItem("bitbucket_username", bitbucketUsername);
        localStorage.setItem("bitbucket_display_name", displayName || "");
        localStorage.setItem("bitbucket_avatar_url", avatarUrl || "");
        navigate("/bitbucket-connections");
      } else {
        console.error("❌ Missing Bitbucket username in query params");
        navigate("/signin");
      }
    }
  }, [navigate]);

  return <p>{loadingMessage}</p>;
};

export default FormPage;
