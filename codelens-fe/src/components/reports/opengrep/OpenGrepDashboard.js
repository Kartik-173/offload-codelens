import React, { useState } from "react";
import {
  Box,
  CircularProgress,
  Typography
} from "@mui/material";

import { useOpenGrepDetails } from "../../../hooks/useOpenGrepDetails";
import ReportTabs from "../ReportTabs";

import OpenGrepOverviewTab from "./opengrepTab/OpenGrepOverviewTab";
import OpenGrepFindingsTab from "./opengrepTab/OpenGrepFindingsTab";
import OpenGrepRulesTab from "./opengrepTab/OpenGrepRulesTab";
import OpenGrepCodeTab from "./opengrepTab/OpenGrepCodeTab";
import OpenGrepScanInfoTab from "./opengrepTab/OpenGrepScanInfoTab";
// import OpenGrepLanguagesTab from "./opengrepTab/OpenGrepLanguagesTab";

const OPENGREP_TABS = [
  { label: "Overview" },
  { label: "Findings" },
  { label: "Rules" },
  { label: "Code" },
  { label: "Scan Info" },
  { label: "Languages" }
];

const OpenGrepDashboard = ({ projectKey, onError }) => {
  const [selectedTab, setSelectedTab] = useState(0);

  const { details, loading } = useOpenGrepDetails(projectKey, onError);

  if (!projectKey) return null;

  if (loading) {
    return (
      <Box className="repo-list-loading">
        <CircularProgress />
      </Box>
    );
  }

  if (!details) {
    return (
      <Typography sx={{ padding: 2 }}>
        No OpenGrep data available
      </Typography>
    );
  }

  return (
    <>
      <ReportTabs
        value={selectedTab}
        onChange={setSelectedTab}
        tabs={OPENGREP_TABS}
      />

      {selectedTab === 0 && (
        <OpenGrepOverviewTab details={details} />
      )}

      {selectedTab === 1 && (
        <OpenGrepFindingsTab findings={details.findings} />
      )}

      {selectedTab === 2 && (
        <OpenGrepRulesTab details={details} />
      )}

      {selectedTab === 3 && (
        <OpenGrepCodeTab findings={details.findings} />
      )}

      {selectedTab === 4 && (
        <OpenGrepScanInfoTab
          scanMetadata={details.scan_metadata}
          scanStatus={details.scan_status}
        />
      )}

      {/* {selectedTab === 5 && (
        <OpenGrepLanguagesTab
          languages={details.summary.languages}
        />
      )} */}
    </>
  );
};

export default OpenGrepDashboard;
