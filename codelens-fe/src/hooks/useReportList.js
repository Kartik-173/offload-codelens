import { useEffect, useState } from "react";
import RepoApiService from "../services/RepoApiService";

export const useReportList = (userId, onError) => {
  const [reportList, setReportList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const parseTs = (key) => {
      try {
        const projectKey = key?.split("/")[2];
        if (!projectKey) return 0;

        const parts = projectKey.split("_");
        if (parts.length < 3) return 0;

        const datePart = parts[parts.length - 2];
        const timePart = parts[parts.length - 1];

        if (!/^\d{8}$/.test(datePart) || !/^\d{6}$/.test(timePart)) return 0;

        const iso = `${datePart.slice(0, 4)}-${datePart.slice(
          4,
          6
        )}-${datePart.slice(6, 8)}T${timePart.slice(
          0,
          2
        )}:${timePart.slice(2, 4)}:${timePart.slice(4, 6)}Z`;

        return Date.parse(iso) || 0;
      } catch {
        return 0;
      }
    };

    const loadReports = async () => {
      try {
        setLoading(true);
        const resp = await RepoApiService.fetchReportList();
        const items = Array.isArray(resp?.data) ? [...resp.data] : [];

        items.sort((a, b) => parseTs(b?.Key) - parseTs(a?.Key));
        setReportList(items);
      } catch (err) {
        console.error("fetchReportList failed", err);
        onError?.(err);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [userId]);

  return { reportList, loading };
};
