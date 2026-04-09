import React, { useState } from "react";

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
];

const OpenGrepDashboard = ({ projectKey, onError }) => {
  const [selectedTab, setSelectedTab] = useState(0);

  const { details, loading } = useOpenGrepDetails(projectKey, onError);

  if (!projectKey) return null;

  if (loading) {
    return (
      <div className="repo-list-loading flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
      </div>
    );
  }

  if (!details) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        No OpenGrep data available.
      </div>
    );
  }

  const findings = details.findings || [];

  return (
    <div className="space-y-4">
      <ReportTabs
        value={selectedTab}
        onChange={setSelectedTab}
        tabs={OPENGREP_TABS}
      />

      {selectedTab === 0 && (
        <OpenGrepOverviewTab details={details} />
      )}

      {selectedTab === 1 && (
        <OpenGrepFindingsTab findings={findings} />
      )}

      {selectedTab === 2 && (
        <OpenGrepRulesTab details={details} />
      )}

      {selectedTab === 3 && (
        <OpenGrepCodeTab findings={findings} />
      )}

      {selectedTab === 4 && (
        <OpenGrepScanInfoTab
          scanMetadata={details.scan_metadata}
          scanStatus={details.scan_status}
        />
      )}

    </div>
  );
};

export default OpenGrepDashboard;
