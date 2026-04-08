import React, { useMemo, useState } from "react";
import { Download, Search, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";

const statusStyles = {
  deprecated: "border-amber-300 bg-amber-100 text-amber-900",
  major: "border-red-200 bg-red-50 text-red-700",
  minor: "border-orange-200 bg-orange-50 text-orange-700",
  patch: "border-sky-200 bg-sky-50 text-sky-700",
  upToDate: "border-emerald-200 bg-emerald-50 text-emerald-700",
  unknown: "border-slate-200 bg-slate-50 text-slate-600",
};

export default function GitReportView({ loading, reportDetails }) {
  const gitReport = reportDetails?.data?.gitReport || { packages: [], summary: {} };
  const packages = Array.isArray(gitReport.packages) ? gitReport.packages : [];

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [ecosystemFilter, setEcosystemFilter] = useState("all");
  const [statusFilters, setStatusFilters] = useState(new Set());
  const [deprecatedOnly, setDeprecatedOnly] = useState(false);
  const [sortKey, setSortKey] = useState("severity");
  const [sortDir, setSortDir] = useState("asc");

  const sorted = useMemo(() => {
    const weight = { deprecated: 0, major: 1, minor: 2, patch: 3, upToDate: 4, unknown: 5 };
    const arr = [...packages];
    const dir = sortDir === "desc" ? -1 : 1;
    const cmpStr = (x, y) => (x || "").localeCompare(y || "") * dir;

    arr.sort((a, b) => {
      if (sortKey === "severity") {
        const left = a.deprecated ? "deprecated" : a.status || "unknown";
        const right = b.deprecated ? "deprecated" : b.status || "unknown";
        const diff = (weight[left] ?? 9) - (weight[right] ?? 9);
        if (diff !== 0) return diff * dir;
        return cmpStr(a.name, b.name);
      }
      if (sortKey === "name") return cmpStr(a.name, b.name);
      if (sortKey === "current") return cmpStr(a.current, b.current);
      if (sortKey === "compatible") return cmpStr(a.compatible || a.wanted, b.compatible || b.wanted);
      if (sortKey === "latest") return cmpStr(a.latest, b.latest);
      if (sortKey === "type") return cmpStr(a.type, b.type);
      return 0;
    });

    return arr;
  }, [packages, sortDir, sortKey]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sorted.filter((pkg) => {
      const eco = String(pkg.ecosystem || "npm").toLowerCase();
      if (query && !String(pkg.name || "").toLowerCase().includes(query)) return false;
      if (typeFilter !== "all" && String(pkg.type || "").toLowerCase() !== typeFilter) return false;
      if (ecosystemFilter !== "all" && eco !== ecosystemFilter) return false;
      if (deprecatedOnly) return !!pkg.deprecated;
      if (statusFilters.size > 0 && !statusFilters.has(pkg.status || "unknown")) return false;
      return true;
    });
  }, [deprecatedOnly, ecosystemFilter, search, sorted, statusFilters, typeFilter]);

  const counts = useMemo(() => {
    const countMap = { total: packages.length, major: 0, minor: 0, patch: 0, upToDate: 0, unknown: 0, deprecated: 0 };
    packages.forEach((pkg) => {
      const status = pkg.status || "unknown";
      if (status === "major") countMap.major += 1;
      else if (status === "minor") countMap.minor += 1;
      else if (status === "patch") countMap.patch += 1;
      else if (status === "upToDate") countMap.upToDate += 1;
      else countMap.unknown += 1;

      if (pkg.deprecated) countMap.deprecated += 1;
    });
    countMap.outdated = countMap.major + countMap.minor + countMap.patch;
    return countMap;
  }, [packages]);

  const toggleStatus = (status) => {
    setDeprecatedOnly(false);
    setStatusFilters((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const setSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  const exportCSV = () => {
    const rows = filtered.map((pkg) => ({
      name: pkg.name,
      current: pkg.current,
      compatible: pkg.compatible || pkg.wanted || "",
      latest: pkg.latest || "",
      type: pkg.type,
      ecosystem: pkg.ecosystem,
      severity: pkg.deprecated ? "Deprecated" : String(pkg.status || "unknown").replace("upToDate", "Up-to-date"),
      packageJsonPath: pkg.packageJsonPath || "",
    }));
    const header = Object.keys(rows[0] || {
      name: "name",
      current: "current",
      compatible: "compatible",
      latest: "latest",
      type: "type",
      ecosystem: "ecosystem",
      severity: "severity",
      packageJsonPath: "packageJsonPath",
    });
    const csv = [header.join(",")]
      .concat(
        rows.map((row) =>
          header
            .map((key) => String(row[key] ?? "").replaceAll('"', '""'))
            .map((value) => (/[",\n]/.test(value) ? `"${value}"` : value))
            .join(",")
        )
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `git-report-${Date.now()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-[340px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2">
      <Card className="border-slate-200 bg-gradient-to-r from-slate-50 via-white to-indigo-50">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Insights / Git Report</h3>
              <p className="text-sm text-slate-600">Dependency freshness, upgrade severity, and deprecated package tracking.</p>
            </div>
            <button
              type="button"
              onClick={exportCSV}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => { setDeprecatedOnly(false); setStatusFilters(new Set()); }} className="rounded-xl border border-slate-200 bg-white p-3 text-left hover:border-slate-300">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total dependencies</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{counts.total}</p>
            </button>
            <button type="button" onClick={() => { setDeprecatedOnly(false); setStatusFilters(new Set(["major", "minor", "patch"])); }} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-left hover:border-amber-300">
              <p className="text-xs uppercase tracking-wide text-amber-700">Outdated</p>
              <p className="mt-1 text-2xl font-semibold text-amber-900">{counts.outdated}</p>
            </button>
            <button type="button" onClick={() => { setStatusFilters(new Set()); setDeprecatedOnly(true); }} className="rounded-xl border border-red-200 bg-red-50 p-3 text-left hover:border-red-300">
              <p className="text-xs uppercase tracking-wide text-red-700">Deprecated</p>
              <p className="mt-1 text-2xl font-semibold text-red-900">{counts.deprecated}</p>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search packages"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
              <option value="all">All Types</option>
              <option value="dependency">Dependencies</option>
              <option value="devdependency">Dev Dependencies</option>
            </select>
            <select value={ecosystemFilter} onChange={(event) => setEcosystemFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700">
              <option value="all">All Ecosystems</option>
              <option value="npm">npm</option>
              <option value="pypi">PyPI</option>
              <option value="php">PHP</option>
              <option value="gomod">Go</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: "major", label: `Major ${counts.major}` },
              { key: "minor", label: `Minor ${counts.minor}` },
              { key: "patch", label: `Patch ${counts.patch}` },
              { key: "upToDate", label: `Up-to-date ${counts.upToDate}` },
              { key: "unknown", label: `Unknown ${counts.unknown}` },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleStatus(item.key)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${statusFilters.has(item.key) ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
              >
                {item.label}
              </button>
            ))}
            {deprecatedOnly && (
              <button
                type="button"
                onClick={() => setDeprecatedOnly(false)}
                className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900"
              >
                Deprecated only ×
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-3 text-left font-semibold">#</th>
                {[
                  ["name", "Package"],
                  ["current", "Current"],
                  ["compatible", "Compatible"],
                  ["latest", "Latest"],
                  ["type", "Type"],
                  ["severity", "Severity"],
                ].map(([key, label]) => (
                  <th key={key} className="px-3 py-3 text-left font-semibold">
                    <button type="button" onClick={() => setSort(key)} className="inline-flex items-center gap-1 hover:text-slate-700">
                      {label}
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.map((pkg, idx) => {
                const status = pkg.deprecated ? "deprecated" : pkg.status || "unknown";
                const statusLabel = pkg.deprecated ? "Deprecated" : String(pkg.status || "unknown").replace("upToDate", "Up-to-date");
                return (
                  <tr key={`${pkg.name}-${idx}`} className="border-t border-slate-100 hover:bg-slate-50/70">
                    <td className="px-3 py-3 text-slate-500">{idx + 1}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {pkg.homepage ? (
                          <a href={pkg.homepage} target="_blank" rel="noreferrer" className="max-w-[280px] truncate font-medium text-blue-700 hover:text-blue-900">
                            {pkg.name}
                          </a>
                        ) : (
                          <span className="max-w-[280px] truncate font-medium text-slate-800">{pkg.name}</span>
                        )}
                        <Badge variant="outline" className="border-slate-200 bg-white text-[10px] uppercase text-slate-600">
                          {(pkg.ecosystem || "npm").toUpperCase()}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-700">{pkg.current || "-"}</td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-700">{pkg.compatible || pkg.wanted || "-"}</td>
                    <td className="px-3 py-3 font-mono text-xs text-slate-700">{pkg.latest || "-"}</td>
                    <td className="px-3 py-3 capitalize text-slate-600">{pkg.type || "-"}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusStyles[status] || statusStyles.unknown}`}>
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-sm text-slate-500">
                    No packages match your active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
