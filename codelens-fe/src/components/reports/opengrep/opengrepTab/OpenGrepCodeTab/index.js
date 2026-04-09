import React, { useEffect, useMemo, useState } from "react";
import CodeFindingList from "./CodeFindingList";
import CodeViewer from "./CodeViewer";

const Box = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const Typography = ({ children, className = "" }) => (
  <p className={className}>{children}</p>
);

const SEVERITIES = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];
const SEVERITY_BTN_CLASS = {
  ALL: "border-slate-200 bg-white text-slate-700",
  CRITICAL: "border-rose-200 bg-rose-50 text-rose-700",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const OpenGrepCodeTab = ({ findings }) => {
  const findingRows = findings || [];
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
    if (severityFilter === "ALL") return findingRows;
    return findingRows.filter(
      (f) => f.severity?.toUpperCase() === severityFilter
    );
  }, [findingRows, severityFilter]);

  useEffect(() => {
    if (filteredFindings.length === 0) {
      setSelectedFinding(null);
      return;
    }

    if (!selectedFinding || !filteredFindings.includes(selectedFinding)) {
      setSelectedFinding(filteredFindings[0]);
    }
  }, [filteredFindings, selectedFinding]);

  if (!findingRows.length) {
    return (
      <Box className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        <Typography>No findings available.</Typography>
      </Box>
    );
  }

  return (
    <Box className="space-y-4">
      <Box className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
        {SEVERITIES.map((s) => (
          <button
            key={s}
            type="button"
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              severityFilter === s
                ? `${SEVERITY_BTN_CLASS[s]} ring-2 ring-offset-1 ring-cyan-200`
                : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
            onClick={() => setSeverityFilter(s)}
          >
            {s}
          </button>
        ))}
      </Box>

      <Box className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
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
