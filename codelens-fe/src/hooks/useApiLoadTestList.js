import { useEffect, useState } from "react";
import ApiLoadTestService from "../services/ApiLoadTestService";

export const useApiLoadTestList = (onError) => {
  const [reportList, setReportList] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    try {
      const resp = await ApiLoadTestService.fetchLoadTestList();
      const items = Array.isArray(resp?.data) ? [...resp.data] : [];
      setReportList(items);
    } catch (err) {
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  return { reportList, loading, refresh: loadReports };
};
