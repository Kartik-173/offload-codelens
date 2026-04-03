import React, { useEffect, useState, useCallback } from "react";
import ReportSelector from "../components/reports/ReportSelector";
import SnackbarNotification, {
  SNACKBAR_THEME,
} from "../components/common/SnackbarNotification";
import RunWafScanner from "../components/reports/wafscan/RunWafScanner";
import WafScanDashboard from "../components/reports/wafscan/WafScanDashboard";
import WafScanApiService from "../services/WafScanApiService";

const WafScan = () => {
  const [snackbar, setSnackbar] = useState(null);
  const [reportList, setReportList] = useState([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  const showError = (msg) =>
    setSnackbar({
      id: Date.now(),
      type: "error",
      msg,
    });

  const fetchReportList = useCallback(async () => {
    try {
      setLoadingList(true);
      const res = await WafScanApiService.listScans();
      setReportList(res?.data || []);
      return res?.data || [];
    } catch (error) {
      console.error("Failed to fetch WAF scan list", error);
      showError("Failed to fetch WAF scan list");
      return [];
    } finally {
      setLoadingList(false);
    }
  }, []);

  const fetchReportByKey = useCallback(async (key) => {
    if (!key) return;
    try {
      setLoadingReport(true);
      const res = await WafScanApiService.getReport({ key });
      setReport(res);
    } catch (error) {
      console.error("Failed to fetch WAF scan report", error);
      showError("Failed to fetch WAF scan report");
    } finally {
      setLoadingReport(false);
    }
  }, []);

  const fetchLatestWafReport = useCallback(async () => {
    const scans = await fetchReportList();
    if (scans.length === 0) return;

    const latest = scans[0];
    setSelectedKey(latest.key);
    await fetchReportByKey(latest.key);
  }, [fetchReportList, fetchReportByKey]);

  useEffect(() => {
    fetchLatestWafReport();
  }, [fetchLatestWafReport]);

  useEffect(() => {
    if (selectedKey) {
      fetchReportByKey(selectedKey);
    }
  }, [selectedKey, fetchReportByKey]);

  const selectorItems = reportList.map((i) => ({
    Key: i.key,
    label: i.testFolder,
    projectKey: i.testFolder,
    userId: i.userId,
  }));

  return (
    <div className="repo-list-container">
      <div className="repo-select-section">
        <div className="repo-selector-action-row">
          <ReportSelector
            reports={selectorItems}
            selected={selectedKey}
            onChange={setSelectedKey}
          />

          <RunWafScanner onScanComplete={fetchLatestWafReport} />
        </div>

        <div className="waf-report-dashboard">
          {loadingList && <p>Loading scan list...</p>}
          <WafScanDashboard report={report} loading={loadingReport} />
        </div>
      </div>

      {snackbar && (
        <SnackbarNotification
          key={snackbar.id}
          initialOpen={true}
          message={snackbar.msg}
          theme={SNACKBAR_THEME.RED}
          yPosition="top"
          xPosition="center"
          onCloseHandler={() => setSnackbar(null)}
        />
      )}
    </div>
  );
};

export default WafScan;
