import React, { useEffect, useState } from "react";
import { Loader2, FileBarChart, Shield, AlertTriangle, Code2, Bug } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

import { useToast } from "../components/common/ToastProvider";

import ReportSelector from "../components/reports/ReportSelector";
import ActiveScanBanner from "../components/reports/ActiveScanBanner";

import SonarDashboard from "../components/reports/sonar/SonarDashboard";
import OpenGrepDashboard from "../components/reports/opengrep/OpenGrepDashboard";

import { useReportList } from "../hooks/useReportList";
import { useScanStatus } from "../hooks/useScanStatus";

const ReportList = () => {
  const { error } = useToast();
  const userId = localStorage.getItem("userId");
  const activeProjectKey = localStorage.getItem("activeScanProjectKey");

  const [activeDashboard, setActiveDashboard] = useState("sonar");
  const [selectedReport, setSelectedReport] = useState("");

  const scanStatus = useScanStatus(activeProjectKey, userId);

  const showError = (msg) => error(msg);

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
    <div className="reports-page min-h-screen bg-slate-50">
      <div className="reports-container mx-auto max-w-7xl p-6">
        {/* Page Header */}
        <div className="reports-header mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Security Reports</h1>
              <p className="mt-1 text-sm text-slate-600">
                View detailed analysis and security insights for your repositories
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-white">
                <FileBarChart className="mr-1 h-3 w-3" />
                {reportList.length} Reports
              </Badge>
            </div>
          </div>
        </div>

        {/* Active Scan Banner */}
        <ActiveScanBanner status={scanStatus} onDismiss={clearActiveScan} />

        {/* Report Selector Card */}
        <Card className="mb-6 border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <ReportSelector
                  reports={reportList}
                  selected={selectedReport}
                  onChange={setSelectedReport}
                  loading={loadingReports}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Tabs */}
        <Tabs
          value={activeDashboard}
          onValueChange={setActiveDashboard}
          className="reports-tabs"
        >
          <Card className="border-slate-200">
            <CardHeader className="border-b border-slate-100 pb-0">
              <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100">
                <TabsTrigger value="sonar" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Sonar Dashboard
                </TabsTrigger>
                <TabsTrigger value="opengrep" className="flex items-center gap-2">
                  <Code2 className="h-4 w-4" />
                  OpenGrep Dashboard
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-6">
              <TabsContent value="sonar" className="mt-0">
                {loadingReports ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-sm text-slate-600">Loading reports...</span>
                  </div>
                ) : (
                  <SonarDashboard
                    reportKey={selectedReport}
                    userId={userId}
                    onError={showError}
                  />
                )}
              </TabsContent>

              <TabsContent value="opengrep" className="mt-0">
                {loadingReports ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-sm text-slate-600">Loading reports...</span>
                  </div>
                ) : (
                  <OpenGrepDashboard
                    projectKey={selectedReport}
                    userId={userId}
                    onError={showError}
                  />
                )}
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
};

export default ReportList;
