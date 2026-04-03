import React from "react";
import { Box, Divider } from "@mui/material";

import OverviewCards from "./OverviewCards";
import SeverityBreakdown from "./SeverityBreakdown";
import CWESummary from "./CWESummary";
import LanguageSummary from "./LanguageSummary";
import ScanMetadata from "./ScanMetadata";

const OpenGrepOverviewTab = ({ details }) => {
  if (!details) return null;

  const { summary, scan_metadata } = details;

  return (
    <Box className="opengrep-overview-container">
      <OverviewCards summary={summary} />

      <Divider className="opengrep-divider" />

      <Box className="opengrep-grid-2">
        <SeverityBreakdown severity={summary.severity_count} />
        <CWESummary cwe={summary.cwe} />
      </Box>

      <Divider className="opengrep-divider" />

      <Box className="opengrep-grid-2">
        <LanguageSummary languages={summary.languages} />
        <ScanMetadata metadata={scan_metadata} />
      </Box>
    </Box>
  );
};

export default OpenGrepOverviewTab;
