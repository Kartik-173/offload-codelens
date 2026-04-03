import React, { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";

import SnackbarNotification, {
  SNACKBAR_THEME,
} from "../components/common/SnackbarNotification";

import ReportSelector from "../components/reports/ReportSelector";
import ActiveScanBanner from "../components/reports/ActiveScanBanner";

import SonarDashboard from "../components/reports/sonar/SonarDashboard";
import OpenGrepDashboard from "../components/reports/opengrep/OpenGrepDashboard";

import { useReportList } from "../hooks/useReportList";
import { useScanStatus } from "../hooks/useScanStatus";

const ReportList = () => {
  const userId = localStorage.getItem("userId");
  const activeProjectKey = localStorage.getItem("activeScanProjectKey");

  const [activeDashboard, setActiveDashboard] = useState("sonar");
  const [selectedReport, setSelectedReport] = useState("");
  const [snackbar, setSnackbar] = useState(null);

  const scanStatus = useScanStatus(activeProjectKey, userId);

  const showError = (msg) =>
    setSnackbar({
      id: Date.now(),
      type: "error",
      msg,
    });

  const clearActiveScan = () => {
    localStorage.removeItem("activeScanProjectKey");
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("activeProjectKey");
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    } catch (_) {}
  };

  useEffect(() => {
    if (
      scanStatus &&
      ["completed", "failed", "not_found"].includes(scanStatus.status)
    ) {
      clearActiveScan();
    }
  }, [scanStatus]);

  const { reportList, loading: loadingReports } = useReportList(
    userId,
    () => showError("Failed to load reports")
  );

  useEffect(() => {
    if (!selectedReport && reportList.length > 0) {
      setSelectedReport(reportList[0].Key);
    }
  }, [reportList, selectedReport]);

  return (
    <div className="repo-list-container">
      <div className="repo-select-section">
        <Tabs
          value={activeDashboard}
          onChange={(_, v) => setActiveDashboard(v)}
          className="report-tabs-wrapper"
        >
          <Tab value="sonar" label="Sonar Dashboard" />
          <Tab value="opengrep" label="OpenGrep Dashboard" />
        </Tabs>

        <ActiveScanBanner
          status={scanStatus}
          onDismiss={clearActiveScan}
        />

        {loadingReports ? (
          <Box className="repo-list-loading">
            <CircularProgress />
          </Box>
        ) : (
          <ReportSelector
            reports={reportList}
            selected={selectedReport}
            onChange={setSelectedReport}
          />
        )}

        {activeDashboard === "sonar" && (
          <SonarDashboard
            reportKey={selectedReport}
            userId={userId}
            onError={showError}
          />
        )}

        {activeDashboard === "opengrep" && (
          <OpenGrepDashboard
            projectKey={selectedReport}
            userId={userId}
            onError={showError}
          />
        )}
      </div>

      {snackbar && (
        <SnackbarNotification
          key={snackbar.id}
          initialOpen={true}
          message={snackbar.msg}
          theme={
            snackbar.type === "error"
              ? SNACKBAR_THEME.RED
              : SNACKBAR_THEME.GREEN
          }
          yPosition={'top'}
          xPosition={'center'}
          onCloseHandler={() => setSnackbar(null)}
        />
      )}
    </div>
  );
};

export default ReportList;
