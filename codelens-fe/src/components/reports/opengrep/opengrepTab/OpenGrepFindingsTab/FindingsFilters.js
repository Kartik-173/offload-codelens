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
    <Box className="rounded-xl border border-slate-200 bg-white p-4">
      <Box className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Box className="flex flex-wrap items-center gap-2">
          <Box className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-slate-700">
            <SlidersHorizontal className="h-4 w-4" />
            <Typography className="text-xs font-medium">Filters</Typography>
          </Box>

          <select
            value={filters.severity}
            onChange={(e) => onChange({ ...filters, severity: e.target.value })}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
          >
            {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value })}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
          >
            {["ALL", "security", "other"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={filters.cwe}
            onChange={(e) => onChange({ ...filters, cwe: e.target.value })}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
          >
            <option value="ALL">ALL</option>
            {cweOptions.map((cwe) => (
              <option key={cwe} value={cwe}>
                {cwe}
              </option>
            ))}
          </select>
        </Box>

        <Box className="w-full lg:max-w-sm">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by rule or file…"
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-100"
            />
          </div>
        </Box>
      </Box>
    </Box>
  );
};

export default FindingsFilters;
