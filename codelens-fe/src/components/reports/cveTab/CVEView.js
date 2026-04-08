import React, { useEffect, useMemo, useState } from "react";
import {
  Package,
  TriangleAlert,
  ShieldAlert,
  Shield,
  Flame,
  CircleAlert,
  AlertTriangle,
  Info,
  Link2,
  ChevronDown,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";

const severityMeta = {
  CRITICAL: {
    icon: Flame,
    className: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  HIGH: {
    icon: CircleAlert,
    className: "border-orange-200 bg-orange-50 text-orange-700",
    dot: "bg-orange-500",
  },
  MEDIUM: {
    icon: AlertTriangle,
    className: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  LOW: {
    icon: Info,
    className: "border-sky-200 bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
  },
};

export default function CVEView({ loading, cveReport }) {
  const [expandedPkg, setExpandedPkg] = useState({});
  const [expandedVuln, setExpandedVuln] = useState({});

  const items = useMemo(() => (Array.isArray(cveReport?.items) ? cveReport.items : []), [cveReport]);

  const summary = cveReport?.summary || {
    totalPackages: 0,
    affectedPackages: 0,
    totalVulns: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  useEffect(() => {
    const first = items[0];
    if (!first) {
      setExpandedPkg({});
      setExpandedVuln({});
      return;
    }
    setExpandedPkg({ [`${first.name}@${first.version}`]: true });
    setExpandedVuln({});
  }, [items]);

  const togglePackage = (pkgKey) => {
    setExpandedPkg((prev) => ({ ...prev, [pkgKey]: !prev[pkgKey] }));
  };

  const toggleVuln = (vulnKey) => {
    setExpandedVuln((prev) => ({ ...prev, [vulnKey]: !prev[vulnKey] }));
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
      <Card className="border-slate-200 bg-gradient-to-r from-slate-50 via-white to-rose-50">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">CVE Detection</h3>
              <p className="text-sm text-slate-600">Dependency risk overview with package-level vulnerability breakdown.</p>
            </div>
            <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
              {summary.totalVulns} findings
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <Package className="h-4 w-4 text-blue-600" />
              <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Packages</p>
              <p className="text-2xl font-semibold text-slate-900">{summary.totalPackages}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
              <TriangleAlert className="h-4 w-4 text-amber-600" />
              <p className="mt-2 text-xs uppercase tracking-wide text-amber-700">Affected</p>
              <p className="text-2xl font-semibold text-amber-900">{summary.affectedPackages}</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-3">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              <p className="mt-2 text-xs uppercase tracking-wide text-red-700">Vulnerabilities</p>
              <p className="text-2xl font-semibold text-red-900">{summary.totalVulns}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
              <Shield className="h-4 w-4 text-emerald-600" />
              <p className="mt-2 text-xs uppercase tracking-wide text-emerald-700">Severity Mix</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {Object.entries({
                  CRITICAL: summary.critical,
                  HIGH: summary.high,
                  MEDIUM: summary.medium,
                  LOW: summary.low,
                })
                  .filter(([, value]) => value > 0)
                  .map(([severity, value]) => {
                    const Icon = severityMeta[severity].icon;
                    return (
                      <span
                        key={severity}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${severityMeta[severity].className}`}
                      >
                        <Icon className="h-3 w-3" />
                        {value}
                      </span>
                    );
                  })}
                {summary.totalVulns === 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-xs text-emerald-700">
                    <CheckCircle className="h-3 w-3" />
                    None
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
            <p className="text-base font-semibold text-slate-900">No CVEs detected</p>
            <p className="text-sm text-slate-500">All scanned dependencies are currently clear of known vulnerabilities.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((pkg) => {
            const pkgKey = `${pkg.name}@${pkg.version}`;
            const isPkgExpanded = !!expandedPkg[pkgKey];

            return (
              <Card key={pkgKey} className="overflow-hidden border-slate-200">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                  onClick={() => togglePackage(pkgKey)}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{pkg.name}</p>
                    <p className="text-xs text-slate-500">v{pkg.version}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                      {pkg.count} vuln{pkg.count !== 1 ? "s" : ""}
                    </Badge>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isPkgExpanded ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {isPkgExpanded && (
                  <CardContent className="space-y-2 border-t border-slate-100 p-4">
                    {pkg.vulnerabilities?.map((vuln) => {
                      const vulnKey = `${pkgKey}-${vuln.id}`;
                      const isVulnExpanded = !!expandedVuln[vulnKey];
                      const severity = String(vuln.severity || "LOW").toUpperCase();
                      const meta = severityMeta[severity] || severityMeta.LOW;
                      const cveAlias = Array.isArray(vuln.aliases)
                        ? vuln.aliases.find((alias) => alias.startsWith("CVE-"))
                        : null;

                      return (
                        <div key={vuln.id} className="rounded-lg border border-slate-200">
                          <button
                            type="button"
                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
                            onClick={() => toggleVuln(vulnKey)}
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                                <span className="text-sm font-medium text-slate-800">{vuln.id}</span>
                                {cveAlias && (
                                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600">
                                    {cveAlias}
                                  </span>
                                )}
                              </div>
                              {vuln.summary && (
                                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{vuln.summary}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full border px-2 py-0.5 text-xs ${meta.className}`}>
                                {severity}
                              </span>
                              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isVulnExpanded ? "rotate-180" : ""}`} />
                            </div>
                          </button>

                          {isVulnExpanded && Array.isArray(vuln.references) && vuln.references.length > 0 && (
                            <div className="border-t border-slate-100 px-3 py-3">
                              <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <Link2 className="h-3.5 w-3.5" />
                                References
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {vuln.references.slice(0, 6).map((ref, idx) => (
                                  <a
                                    key={`${ref.url}-${idx}`}
                                    href={ref.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex max-w-full items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                                    title={ref.url}
                                  >
                                    {(ref.type || `Ref ${idx + 1}`).toUpperCase()}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
