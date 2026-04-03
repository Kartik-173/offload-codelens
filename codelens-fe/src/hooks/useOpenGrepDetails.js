import { useEffect, useState } from "react";
import RepoApiService from "../services/RepoApiService";

export const useOpenGrepDetails = (projectKey, onError) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectKey) return;

    const load = async () => {
      try {
        setLoading(true);
        const resp = await RepoApiService.fetchOpenGrepReport(projectKey);
        if (resp?.error) { throw new Error(resp.error.message); }
        setDetails(resp?.data || null);
      } catch (err) {
        console.error("useOpenGrepDetails error:", err);
        const message =
          err?.message ||
          err?.response?.data?.error?.message ||
          "Failed to load OpenGrep report";
        onError?.(message);
        setDetails(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [projectKey]);

  return { details, loading };
};
