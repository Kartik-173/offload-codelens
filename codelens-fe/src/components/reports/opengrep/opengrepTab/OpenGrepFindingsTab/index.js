import React, { useState, useMemo } from "react";
import FindingsFilters from "./FindingsFilters";
import FindingsTable from "./FindingsTable";
import FindingDetails from "./FindingDetails";

const Box = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const OpenGrepFindingsTab = ({ findings }) => {
  const findingRows = findings || [];

  const [filters, setFilters] = useState({
    severity: "ALL",
    category: "ALL",
    cwe: "ALL",
    search: ""
  });

  const [selectedFinding, setSelectedFinding] = useState(null);

  const cweOptions = useMemo(
    () => [...new Set(findingRows.map((f) => f.cwe).filter(Boolean))],
    [findingRows]
  );

  const filteredFindings = useMemo(() => {
    const q = filters.search.toLowerCase();

    return findingRows.filter((f) => {
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
  }, [filters, findingRows]);

  return (
    <Box className="space-y-4">
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
