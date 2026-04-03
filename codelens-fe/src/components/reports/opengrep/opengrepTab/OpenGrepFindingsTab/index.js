import React, { useState, useMemo } from "react";
import { Box } from "@mui/material";

import FindingsFilters from "./FindingsFilters";
import FindingsTable from "./FindingsTable";
import FindingDetails from "./FindingDetails";

const OpenGrepFindingsTab = ({ findings }) => {
  const [filters, setFilters] = useState({
    severity: "ALL",
    category: "ALL",
    cwe: "ALL",
    search: ""
  });

  const [selectedFinding, setSelectedFinding] = useState(null);

  const cweOptions = useMemo(
    () => [...new Set(findings.map((f) => f.cwe).filter(Boolean))],
    [findings]
  );

  const filteredFindings = useMemo(() => {
    const q = filters.search.toLowerCase();

    return findings.filter((f) => {
      if (filters.severity !== "ALL" && f.severity !== filters.severity)
        return false;

      if (filters.category !== "ALL" && f.category !== filters.category)
        return false;

      if (filters.cwe !== "ALL" && f.cwe !== filters.cwe)
        return false;

      if (q) {
        return (
          f.rule_id.toLowerCase().includes(q) ||
          f.file_path.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [filters, findings]);

  return (
    <Box className="opengrep-findings-container">
      <FindingsFilters
        filters={filters}
        onChange={setFilters}
        cweOptions={cweOptions}
      />

      <FindingsTable
        rows={filteredFindings}
        onRowClick={setSelectedFinding}
      />

      <FindingDetails
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
      />
    </Box>
  );
};

export default OpenGrepFindingsTab;
