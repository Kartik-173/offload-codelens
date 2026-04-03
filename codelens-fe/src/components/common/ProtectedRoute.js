import { useEffect, useState } from "react";
import axios from "axios";
import { ENV } from '../../config/env';

// Helper to decode JWT payload
const decodeToken = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id_token = localStorage.getItem("id_token");
    const userId = localStorage.getItem("userId");
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    const isTokenExpired = (token) => {
      const decoded = decodeToken(token);
      if (!decoded?.exp) return true; // invalid token
      const now = Math.floor(Date.now() / 1000);
      return decoded.exp < now;
    };

    if (!id_token || !userId || isTokenExpired(id_token)) {
      // Clear expired tokens
      localStorage.removeItem("id_token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("userId");

      if (code) {
        // Exchange code for new tokens
        axios
          .post(
            `${ENV.API_BASE_URL}/api/auth/register`,
            { code }
          ).then((res) => {
            const data = res?.data?.data;
            if (data?.id_token && data?.userId) {
              localStorage.setItem("id_token", data.id_token);
              localStorage.setItem("access_token", data.access_token);
              localStorage.setItem("userId", data.userId);

              // Remove ?code=... from URL
              window.history.replaceState(
                {},
                document.title,
                window.location.pathname
              );

              setLoading(false);
              window.location.href = "/home";
            } else {
              localStorage.removeItem("id_token");
              localStorage.removeItem("access_token");
              localStorage.removeItem("userId");
              if (ENV.LOGIN_PAGE) {
                 window.location.href = ENV.LOGIN_PAGE;
              }
            }
          })
          .catch(() => {
            localStorage.removeItem("id_token");
            localStorage.removeItem("access_token");
            localStorage.removeItem("userId");
            if (ENV.LOGIN_PAGE) {
               window.location.href = ENV.LOGIN_PAGE;
            }
          });
      } else {
        if (ENV.LOGIN_PAGE) {
           window.location.href = ENV.LOGIN_PAGE;
        }
      }
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div>Loading...</div>; // better: replace with spinner component
  }

  return children;
};

export default ProtectedRoute;
