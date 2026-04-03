import React from "react";
import { Box, Typography } from "@mui/material";

const CodeFindingList = ({ findings, selectedFinding, onSelect }) => {
  return (
    <Box className="opengrep-code-list">
      {findings.map((f, idx) => {
        const isActive = selectedFinding === f;

        return (
          <Box
            key={idx}
            className={`opengrep-code-list-item ${isActive ? "active" : ""}`}
            onClick={() => onSelect(f)}
          >
            <Box className="list-item-header">
              <Typography className="file-path" title={f.file_path}>
                {f.file_path}
              </Typography>

              <span
                className={`severity severity-${f.severity.toLowerCase()}`}
              >
                {f.severity}
              </span>
            </Box>

            <Typography className="rule-id">
              {f.rule_id}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

export default CodeFindingList;
