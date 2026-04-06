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

  if (loading || !report) {
    return (
      <Box className="repo-list-loading flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
      </Box>
    );
  }

  return (
    <>
      <ReportTabs
        value={selectedTab}
        onChange={setSelectedTab}
        tabs={API_TABS}
      />

      {selectedTab === 0 && <ApiSummaryView report={report} />}
      {selectedTab === 1 && <ApiPerformanceView report={report} />}
    </>
  );
};

export default ApiLoadTestDashboard;
