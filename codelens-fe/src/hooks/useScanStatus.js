import { useEffect, useRef, useState } from "react";
import RepoApiService from "../services/RepoApiService";

export const useScanStatus = (projectKey, userId) => {
  const [status, setStatus] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    // ⛔ No polling without required data
    if (!projectKey || !userId) {
      stopPolling();
      setStatus(null);
      return;
    }

    const poll = async () => {
      try {
        const resp = await RepoApiService.fetchScanStatus(projectKey, userId);
        const data = resp?.data;

        setStatus(data);

        // ✅ STOP polling for terminal states
        if (
          !data ||
          data.status === "not_found" ||
          data.status === "completed" ||
          data.status === "failed"
        ) {
          stopPolling();
        }
      } catch (err) {
        console.error("scan status poll failed", err);
        stopPolling();
      }
    };

    // start immediately
    poll();

    // then poll every 2.5s
    intervalRef.current = setInterval(poll, 2500);

    return stopPolling;
  }, [projectKey, userId]);

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return status;
};
