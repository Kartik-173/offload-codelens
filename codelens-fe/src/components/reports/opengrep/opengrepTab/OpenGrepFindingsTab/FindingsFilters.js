import React from "react";
import { Search, SlidersHorizontal } from "lucide-react";

const Box = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const Typography = ({ children, className = "" }) => (
  <p className={className}>{children}</p>
);

const FindingsFilters = ({ filters, onChange, cweOptions }) => {
  return (
    <Box className="findings-filters">
      <Box className="filters-left">
        <Box className="filters-title">
          <SlidersHorizontal className="h-4 w-4" />
          <Typography className="text-xs">Filters</Typography>
        </Box>

        <select
          value={filters.severity}
          onChange={(e) =>
            onChange({ ...filters, severity: e.target.value })
          }
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {[
            "ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={filters.category}
          onChange={(e) =>
            onChange({ ...filters, category: e.target.value })
          }
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          {["ALL", "security", "other"].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={filters.cwe}
          onChange={(e) =>
            onChange({ ...filters, cwe: e.target.value })
          }
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="ALL">ALL</option>
          {cweOptions.map((cwe) => (
            <option key={cwe} value={cwe}>
              {cwe}
            </option>
          ))}
        </select>
      </Box>

      <Box className="filters-right">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by rule or file…"
            value={filters.search}
            onChange={(e) =>
              onChange({ ...filters, search: e.target.value })
            }
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
          />
        </div>
      </Box>
    </Box>
  );
};

export default FindingsFilters;
