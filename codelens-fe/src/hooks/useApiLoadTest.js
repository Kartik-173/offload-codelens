import { useEffect, useState } from "react";
import ApiLoadTestService from "../services/ApiLoadTestService";

export const useApiLoadTest = (selectedKey, onError) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    if (!selectedKey) return;
    setLoading(true);
    try {
      const resp = await ApiLoadTestService.fetchLoadTestReport(selectedKey);
      setReport(resp?.data || resp);
    } catch (err) {
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedKey]);

  return { report, loading, refresh: fetchReport };
};
