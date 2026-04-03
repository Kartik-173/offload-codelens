import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";

import CodeFindingList from "./CodeFindingList";
import CodeViewer from "./CodeViewer";

const SEVERITIES = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];

const OpenGrepCodeTab = ({ findings }) => {
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [severityFilter, setSeverityFilter] = useState("ALL");

  useEffect(() => {
    const handler = (e) => {
      setSelectedFinding(e.detail);
    };
    window.addEventListener("opengrep:open-code", handler);
    return () => window.removeEventListener("opengrep:open-code", handler);
  }, []);

  const filteredFindings = useMemo(() => {
    if (severityFilter === "ALL") return findings;
    return findings.filter(
      (f) => f.severity?.toUpperCase() === severityFilter
    );
  }, [findings, severityFilter]);

  useEffect(() => {
    if (!selectedFinding && filteredFindings.length > 0) {
      setSelectedFinding(filteredFindings[0]);
    }
  }, [filteredFindings, selectedFinding]);

  if (!findings || findings.length === 0) {
    return <Typography>No findings available</Typography>;
  }

  return (
    <Box className="opengrep-code">
      <Box className="opengrep-code-toolbar">
        {SEVERITIES.map((s) => (
          <button
            key={s}
            className={`filter-btn ${s.toLowerCase()} ${
              severityFilter === s ? "active" : ""
            }`}
            onClick={() => setSeverityFilter(s)}
          >
            {s}
          </button>
        ))}
      </Box>

      <Box className="opengrep-code-layout">
        <CodeFindingList
          findings={filteredFindings}
          selectedFinding={selectedFinding}
          onSelect={setSelectedFinding}
        />
        <CodeViewer finding={selectedFinding} />
      </Box>
    </Box>
  );
};

export default OpenGrepCodeTab;
