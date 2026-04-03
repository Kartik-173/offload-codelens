// src/components/apiLoadTest/ApiLoadTestDashboard.jsx
import React, { useState } from "react";
import { Box, CircularProgress } from "@mui/material";

import ReportTabs from "../reports/ReportTabs";
import ApiSummaryView from "./summaryTab/ApiSummaryView";
import ApiPerformanceView from "./performanceTab/ApiPerformanceView";

const API_TABS = [
  { label: "Summary" },
  { label: "Performance" },
];

const ApiLoadTestDashboard = ({ report, loading }) => {
  const [selectedTab, setSelectedTab] = useState(0);

  if (loading || !report) {
    return (
      <Box className="repo-list-loading">
        <CircularProgress />
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
