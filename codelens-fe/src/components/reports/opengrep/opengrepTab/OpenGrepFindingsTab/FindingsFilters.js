import React from "react";
import {
  Box,
  TextField,
  MenuItem,
  InputAdornment,
  Typography
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";

const FindingsFilters = ({ filters, onChange, cweOptions }) => {
  return (
    <Box className="findings-filters">
      <Box className="filters-left">
        <Box className="filters-title">
          <FilterAltOutlinedIcon fontSize="small" />
          <Typography variant="caption">Filters</Typography>
        </Box>

        <TextField
          select
          size="small"
          label="Severity"
          value={filters.severity}
          onChange={(e) =>
            onChange({ ...filters, severity: e.target.value })
          }
        >
          {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Category"
          value={filters.category}
          onChange={(e) =>
            onChange({ ...filters, category: e.target.value })
          }
        >
          {["ALL", "security", "other"].map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="CWE"
          value={filters.cwe}
          onChange={(e) =>
            onChange({ ...filters, cwe: e.target.value })
          }
        >
          <MenuItem value="ALL">ALL</MenuItem>
          {cweOptions.map((cwe) => (
            <MenuItem key={cwe} value={cwe}>
              {cwe}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Box className="filters-right">
        <TextField
          size="small"
          placeholder="Search by rule or file…"
          value={filters.search}
          onChange={(e) =>
            onChange({ ...filters, search: e.target.value })
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            )
          }}
          fullWidth
        />
      </Box>
    </Box>
  );
};

export default FindingsFilters;
