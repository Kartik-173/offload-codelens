import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";

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
          onValueChange={setActiveDashboard}
          className="report-tabs-wrapper"
        >
          <TabsList>
            <TabsTrigger value="sonar">Sonar Dashboard</TabsTrigger>
            <TabsTrigger value="opengrep">OpenGrep Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="sonar">
            <ActiveScanBanner
              status={scanStatus}
              onDismiss={clearActiveScan}
            />

            {loadingReports ? (
              <div className="repo-list-loading flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <ReportSelector
                reports={reportList}
                selected={selectedReport}
                onChange={setSelectedReport}
              />
            )}

            <SonarDashboard
              reportKey={selectedReport}
              userId={userId}
              onError={showError}
            />
          </TabsContent>

          <TabsContent value="opengrep">
            <ActiveScanBanner
              status={scanStatus}
              onDismiss={clearActiveScan}
            />

            {loadingReports ? (
              <div className="repo-list-loading flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <ReportSelector
                reports={reportList}
                selected={selectedReport}
                onChange={setSelectedReport}
              />
            )}

            <OpenGrepDashboard
              projectKey={selectedReport}
              userId={userId}
              onError={showError}
            />
          </TabsContent>
        </Tabs>
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
