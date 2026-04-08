import React, { useEffect, useMemo, useState } from "react";
import {
  Shield,
  TriangleAlert,
  CircleCheck,
  Search,
  Eye,
  EyeOff,
  ChevronDown,
  Timer,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";

const severityStyles = {
  HIGH: "border-red-200 bg-red-50 text-red-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  LOW: "border-sky-200 bg-sky-50 text-sky-700",
};

export default function GitSecretsView({ loading, gitSecretsReport }) {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [ruleFilter, setRuleFilter] = useState("all");
  const [showSecrets, setShowSecrets] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const findings = useMemo(
    () => (Array.isArray(gitSecretsReport?.findings) ? gitSecretsReport.findings : []),
    [gitSecretsReport]
  );

  const uniqueRules = useMemo(() => {
    return [...new Set(findings.map((finding) => finding.rule).filter(Boolean))].sort();
  }, [findings]);

  const filteredFindings = useMemo(() => {
    return findings.filter((finding) => {
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !search ||
        String(finding.file || "").toLowerCase().includes(search) ||
        String(finding.rule || "").toLowerCase().includes(search) ||
        String(finding.content || "").toLowerCase().includes(search);
      const matchesSeverity =
        severityFilter === "all" ||
        String(finding.severity || "").toUpperCase() === severityFilter;
      const matchesRule = ruleFilter === "all" || finding.rule === ruleFilter;
      return matchesSearch && matchesSeverity && matchesRule;
    });
  }, [findings, searchTerm, severityFilter, ruleFilter]);

  const paginatedFindings = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredFindings.slice(start, start + rowsPerPage);
  }, [filteredFindings, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, severityFilter, ruleFilter]);

  const maskSecret = (content = "") => {
    if (showSecrets) return content;
    if (content.length <= 8) return "*".repeat(content.length);
    return `${content.slice(0, 4)}${"*".repeat(content.length - 8)}${content.slice(-4)}`;
  };

  const toggleRowExpansion = (rowKey) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) next.delete(rowKey);
      else next.add(rowKey);
      return next;
    });
  };

  const summary = {
    totalFindings: gitSecretsReport?.totalFindings || findings.length,
    status: gitSecretsReport?.status || "UNKNOWN",
    scanDuration: gitSecretsReport?.scanDuration || 0,
    scanTime: gitSecretsReport?.scanTime || "",
  };

  const totalPages = Math.max(1, Math.ceil(filteredFindings.length / rowsPerPage));
  const visibleStart = filteredFindings.length === 0 ? 0 : page * rowsPerPage + 1;
  const visibleEnd = Math.min(filteredFindings.length, (page + 1) * rowsPerPage);

  if (loading) {
    return (
      <div className="flex min-h-[340px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2">
      <Card className="border-slate-200 bg-gradient-to-r from-slate-50 via-white to-emerald-50">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Git Secrets</h3>
              <p className="text-sm text-slate-600">Secret detection findings with masked previews and rule-level filtering.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowSecrets((prev) => !prev)}
              className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm ${showSecrets ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-700"}`}
            >
              {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showSecrets ? "Hide Secrets" : "Show Secrets"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <Shield className="h-4 w-4 text-red-600" />
              <p className="mt-2 text-xs uppercase tracking-wide text-red-700">Findings</p>
              <p className="text-2xl font-semibold text-red-900">{summary.totalFindings}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              {summary.status === "PASSED" ? (
                <CircleCheck className="h-4 w-4 text-emerald-600" />
              ) : (
                <TriangleAlert className="h-4 w-4 text-amber-600" />
              )}
              <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Status</p>
              <p className="text-base font-semibold text-slate-900">{summary.status}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <Timer className="h-4 w-4 text-indigo-600" />
              <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Duration</p>
              <p className="text-base font-semibold text-slate-900">{summary.scanDuration} ms</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <Calendar className="h-4 w-4 text-slate-600" />
              <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Last Scan</p>
              <p className="text-base font-semibold text-slate-900">
                {summary.scanTime ? new Date(summary.scanTime).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[240px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by file, rule, or content"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <select
              value={severityFilter}
              onChange={(event) => setSeverityFilter(event.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
            >
              <option value="all">All Severities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={ruleFilter}
              onChange={(event) => setRuleFilter(event.target.value)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
            >
              <option value="all">All Rules</option>
              {uniqueRules.map((rule) => (
                <option key={rule} value={rule}>{rule}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {filteredFindings.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="py-12 text-center">
            <CircleCheck className="mx-auto h-10 w-10 text-emerald-500" />
            <p className="mt-3 text-base font-semibold text-slate-900">
              {findings.length === 0 ? "No Secrets Detected" : "No Matching Results"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {findings.length === 0
                ? "Your repository appears clear of exposed credentials."
                : "Try adjusting the search or filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold">File</th>
                  <th className="px-3 py-3 text-left font-semibold">Line</th>
                  <th className="px-3 py-3 text-left font-semibold">Rule</th>
                  <th className="px-3 py-3 text-left font-semibold">Detected Content</th>
                  <th className="px-3 py-3 text-left font-semibold">Severity</th>
                  <th className="px-3 py-3 text-left font-semibold">Details</th>
                </tr>
              </thead>
              <tbody>
                {paginatedFindings.map((finding, index) => {
                  const rowKey = `${finding.file}:${finding.line}:${finding.rule}:${page}:${index}`;
                  const isExpanded = expandedRows.has(rowKey);
                  const severity = String(finding.severity || "HIGH").toUpperCase();
                  return (
                    <React.Fragment key={rowKey}>
                      <tr className="border-t border-slate-100 hover:bg-slate-50/70">
                        <td className="max-w-[320px] truncate px-3 py-3 text-slate-700" title={finding.file}>{finding.file}</td>
                        <td className="px-3 py-3">
                          <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">L{finding.line}</Badge>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">{finding.rule}</Badge>
                        </td>
                        <td className="max-w-[320px] truncate px-3 py-3 font-mono text-xs text-slate-700" title={maskSecret(finding.content)}>
                          {maskSecret(finding.content)}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${severityStyles[severity] || severityStyles.HIGH}`}>
                            {severity}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => toggleRowExpansion(rowKey)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                          >
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            {isExpanded ? "Hide" : "Show"}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="border-t border-slate-100 bg-slate-50/60">
                          <td colSpan={6} className="px-4 py-3">
                            <div className="rounded-lg border border-slate-200 bg-white p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Detected Content</p>
                              <p className="mt-2 break-words rounded-md bg-slate-950 p-3 font-mono text-xs text-slate-100">
                                {showSecrets ? finding.content : maskSecret(finding.content)}
                              </p>
                              {finding.pattern && (
                                <>
                                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Pattern</p>
                                  <p className="mt-1 text-xs text-slate-700">{finding.pattern}</p>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <select
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                  setPage(0);
                }}
                className="h-8 rounded border border-slate-200 bg-white px-2 text-xs"
              >
                {[10, 25, 50].map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span>{visibleStart}-{visibleEnd} of {filteredFindings.length}</span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={page === 0}
                className="rounded border border-slate-200 p-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>{page + 1}/{totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={page >= totalPages - 1}
                className="rounded border border-slate-200 p-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
