// src/components/apiLoadTest/ApiLoadTestDashboard.jsx
import React, { useState } from "react";
import ReportTabs from "../reports/ReportTabs";
import ApiSummaryView from "./summaryTab/ApiSummaryView";
import ApiPerformanceView from "./performanceTab/ApiPerformanceView";

const Box = ({ children, className = "" }) => <div className={className}>{children}</div>;

const API_TABS = [
  { label: "Summary" },
  { label: "Performance" },
];

const ApiLoadTestDashboard = ({ report, loading }) => {
  const [selectedTab, setSelectedTab] = useState(0);

  if (loading) {
    return (
      <Box className="flex items-center justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
      </Box>
    );
  }

  if (!report) {
    return (
      <Box className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-600">
        Select a report to view Vegeta summary and performance insights.
      </Box>
    );
  }

  return (
    <Box className="mt-4 space-y-4">
      <ReportTabs
        value={selectedTab}
        onChange={setSelectedTab}
        tabs={API_TABS}
      />

      {selectedTab === 0 && <ApiSummaryView report={report} />}
      {selectedTab === 1 && <ApiPerformanceView report={report} />}
    </Box>
  );
};

export default ApiLoadTestDashboard;
