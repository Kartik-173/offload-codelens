import React, { useMemo, useState } from "react";

const Box = ({ children, className = "", onClick }) => (
  <div className={className} onClick={onClick}>{children}</div>
);

const Typography = ({ children, className = "" }) => (
  <p className={className}>{children}</p>
);

const OpenGrepRulesTab = ({ details }) => {
  const rules = useMemo(
    () => details?.rules_statistics?.top_rules || [],
    [details]
  );
  const totalRules = details?.rules_statistics?.total_rules_executed;
  const triggeredRules = details?.rules_statistics?.rules_triggered;

  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");

  const filteredRules = useMemo(() => {
    return rules
      .filter((rule) =>
        rule.rule_id.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) =>
        sortOrder === "desc"
          ? b.hit_count - a.hit_count
          : a.hit_count - b.hit_count
      );
  }, [rules, search, sortOrder]);

  if (!rules.length) {
    return (
      <Box className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        <Typography>No rules data available.</Typography>
      </Box>
    );
  }

  return (
    <Box className="space-y-4">
      <Box className="rounded-xl border border-slate-200 bg-white p-4">
        <Box className="flex flex-wrap items-center justify-between gap-2">
          <Typography className="text-sm font-semibold text-slate-900">
            Rules Summary
          </Typography>

          <button
            type="button"
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
            onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
          >
            Sort: Hit Count ({sortOrder === "desc" ? "High → Low" : "Low → High"})
          </button>
        </Box>

        <Box className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
            Total Rules Executed: <strong>{totalRules ?? "-"}</strong>
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
            Rules Triggered: <strong>{triggeredRules ?? "-"}</strong>
          </span>
        </Box>

        <input
          type="text"
          placeholder="Search by rule ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-3 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
        />
      </Box>

      <Box className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Box className="grid grid-cols-[minmax(0,1fr)_120px] bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <Typography>Rule ID</Typography>
          <Typography className="text-center">Hit Count</Typography>
        </Box>

        {filteredRules.length === 0 && (
          <Box className="px-3 py-6 text-sm text-slate-500">
            <Typography>No matching rules found.</Typography>
          </Box>
        )}

        {filteredRules.map((rule) => (
          <Box
            key={rule.rule_id}
            className="grid grid-cols-[minmax(0,1fr)_120px] items-center border-t border-slate-100 px-3 py-2.5"
          >
            <Typography className="truncate font-mono text-xs text-slate-800">
              {rule.rule_id}
            </Typography>

            <Box className="mx-auto inline-flex min-w-12 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-700">
              {rule.hit_count}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default OpenGrepRulesTab;
