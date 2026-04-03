import React, { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";

import SummaryView from "../summaryTab/SummaryView";
import IssuesView from "../issueTab/IssuesView";
import SecurityHotspotView from "../securityHotspotTab/SecurityHotspotView";
import CodeView from "../codeTab/CodeView";
import GitReportView from "../gitReportTab/GitReportView";
import CVEView from "../cveTab/CVEView";
import GitSecretsView from "../gitSecretsTab/GitSecretsView";

import ReportTabs from "../ReportTabs";
import { useReportDetails } from "../../../hooks/useReportDetails";

const SONAR_TABS = [
  { label: "Summary" },
  { label: "Issues" },
  { label: "Security Hotspots" },
  { label: "Code" },
  { label: "Insights" },
  { label: "CVE Detection" },
  { label: "Git Secrets" }
];

const SonarDashboard = ({ reportKey, userId, onError }) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [issueFilter, setIssueFilter] = useState(null);

  const { details, loading } = useReportDetails(
    reportKey,
    userId,
    () => onError("Failed to load Sonar report")
  );


  const handleMetricClick = (filter) => {
    setIssueFilter(filter);
    setSelectedTab(1);
  };

  const handleLinesOfCodeClick = () => {
    setSelectedTab(3);
  };

  if (!reportKey) return null;

  return (
    <>
      <ReportTabs value={selectedTab} onChange={setSelectedTab} tabs={SONAR_TABS} />

      {loading ? (
        <Box className="repo-list-loading">
          <CircularProgress />
        </Box>
      ) : (
        <>
          {selectedTab === 0 && (
            <SummaryView
              reportDetails={details}
              onMetricClick={handleMetricClick}
              onLinesOfCodeClick={handleLinesOfCodeClick}
            />
          )}

          {selectedTab === 1 && (
            <IssuesView
              reportDetails={details}
              issueFilter={issueFilter}
            />
          )}

          {selectedTab === 2 && (
            <SecurityHotspotView reportDetails={details} />
          )}

          {selectedTab === 3 && <CodeView reportDetails={details} />}
          {selectedTab === 4 && <GitReportView reportDetails={details} />}
          {selectedTab === 5 && (
            <CVEView cveReport={details?.data?.cveReport} />
          )}
          {selectedTab === 6 && (
            <GitSecretsView gitSecretsReport={details?.data?.gitSecretsReport} />
          )}
        </>
      )}
    </>
  );
};

export default SonarDashboard;