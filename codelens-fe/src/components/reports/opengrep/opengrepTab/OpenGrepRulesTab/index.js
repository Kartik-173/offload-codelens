import React, { useMemo, useState } from "react";
import { Box, Typography, TextField } from "@mui/material";

const OpenGrepRulesTab = ({ details }) => {
  const rules = details?.rules_statistics?.top_rules || [];
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
      <Box className="opengrep-rules-empty">
        <Typography>No rules data available</Typography>
      </Box>
    );
  }

  return (
    <Box className="opengrep-rules">
      {/* Header */}
      <Box className="opengrep-rules-header">
        <Box className="opengrep-rules-header-top">
          <Typography variant="h6" className="opengrep-rules-title">
            Rules Summary
          </Typography>

          <Box
            className="opengrep-rules-sort"
            onClick={() =>
              setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
            }
          >
            Sort: Hit Count ({sortOrder === "desc" ? "High → Low" : "Low → High"})
          </Box>
        </Box>

        <Box className="opengrep-rules-meta">
          <Typography className="opengrep-rules-meta-item">
            Total Rules Executed: <strong>{totalRules}</strong>
          </Typography>
          <Typography className="opengrep-rules-meta-item">
            Rules Triggered: <strong>{triggeredRules}</strong>
          </Typography>
        </Box>

        <TextField
          size="small"
          placeholder="Search by rule ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="opengrep-rules-search"
        />
      </Box>

      {/* Table */}
      <Box className="opengrep-rules-table">
        <Box className="opengrep-rules-row opengrep-rules-row-header">
          <Typography className="opengrep-rules-col rule-id">
            Rule ID
          </Typography>
          <Typography className="opengrep-rules-col hit-count">
            Hit Count
          </Typography>
        </Box>

        {filteredRules.length === 0 && (
          <Box className="opengrep-rules-no-match">
            <Typography>No matching rules found</Typography>
          </Box>
        )}

        {filteredRules.map((rule) => (
          <Box
            key={rule.rule_id}
            className="opengrep-rules-row opengrep-rules-row-data"
          >
            <Typography className="opengrep-rules-col rule-id">
              {rule.rule_id}
            </Typography>

            <Box className="opengrep-rules-hit-badge">
              {rule.hit_count}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default OpenGrepRulesTab;
