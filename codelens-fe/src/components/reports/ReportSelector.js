import React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { formatReportName } from "../../utils/Helpers";

const ReportSelector = ({ reports, selected, onChange }) => {
  return (
    <div className="repo-select-grid">
      <div className="dropdown-half">
        <FormControl className="select-control" fullWidth>
          <InputLabel id="report-select-label">Select</InputLabel>
          <Select
            labelId="report-select-label"
            value={selected}
            label="Report"
            size="small"
            onChange={(e) => onChange(e.target.value)}
          >
            {reports.map((item, idx) => (
              <MenuItem key={idx} value={item.Key}>
                {formatReportName(item.projectKey)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    </div>
  );
};

export default ReportSelector;
