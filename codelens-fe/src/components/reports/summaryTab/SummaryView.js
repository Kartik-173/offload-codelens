import React from "react";
import {
  Shield,
  Bug,
  Lock,
  FileCode,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  TrendingUp,
  AlertTriangle,
  Zap,
  GitBranch,
  Calendar,
  BarChart3,
  Folder,
  Layers,
  Building2,
  Boxes,
  Maximize2,
} from "lucide-react";
import {
  bottomMetricsConfig,
  reportInfoConfig,
  reportMetricsConfig,
} from "../../../services/ReportListService";
import IssuesSeverityChart from "./IssuesSeverityChart.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Progress } from "../../ui/progress";

const SummaryView = ({ reportDetails, onMetricClick, onLinesOfCodeClick }) => {
  const categoryByRatingKey = {
    reliabilityRating: "Reliability",
    securityRating: "Security",
    maintainabilityRating: "Maintainability",
  };

  const ratingDescriptions = {
    Security: {
      A: "No security issues above Info severity",
      B: "At least one Low-impact security issue",
      C: "At least one Medium-impact security issue",
      D: "At least one High-impact security issue",
      E: "At least one Critical-impact security issue",
    },
    Reliability: {
      A: "No reliability issues above Info severity",
      B: "At least one Low-impact reliability issue",
      C: "At least one Medium-impact reliability issue",
      D: "At least one High-impact reliability issue",
      E: "At least one Critical-impact reliability issue",
    },
    Maintainability: {
      A: "No maintainability issues above Info severity",
      B: "At least one Low-impact maintainability issue",
      C: "At least one Medium-impact maintainability issue",
      D: "At least one High-impact maintainability issue",
      E: "At least one Critical-impact maintainability issue",
    },
  };

  const getRatingColor = (rating) => {
    switch (rating) {
      case "A":
        return "bg-emerald-500 text-white";
      case "B":
        return "bg-emerald-400 text-white";
      case "C":
        return "bg-yellow-400 text-slate-900";
      case "D":
        return "bg-orange-500 text-white";
      case "E":
        return "bg-red-500 text-white";
      default:
        return "bg-slate-300 text-slate-700";
    }
  };

  const getRatingDescription = (ratingKey, letter) => {
    const category = categoryByRatingKey[ratingKey] || "";
    const map = ratingDescriptions[category] || {};
    return map[letter] || `${category} rating ${letter}`;
  };

  const getReportInfo = (key) => {
    const item = reportInfoConfig.find((i) => i.key === key);
    if (!item) return "—";
    const value = reportDetails?.[key];
    if (value === undefined || value === null) return "—";
    return value;
  };

  return (
    <div className="summary-view space-y-8 p-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Report Overview</h2>
          <p className="text-sm text-slate-600">
            Comprehensive analysis of your codebase quality and security
          </p>
        </div>
        {reportDetails?.projectKey && (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Folder className="mr-1 h-3 w-3" />
            {reportDetails.projectKey}
          </Badge>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Organization */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Organization</p>
                <p className="text-base font-semibold text-slate-900">{getReportInfo("organization")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branch */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <GitBranch className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Branch</p>
                <p className="text-base font-semibold text-slate-900">{getReportInfo("branch")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Projects</p>
                <p className="text-base font-semibold text-slate-900">{getReportInfo("projects")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Size Rating */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-50 text-pink-600">
                <Maximize2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Size Rating</p>
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-slate-900">{getReportInfo("sizeRating")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lines of Code */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <Layers className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600">Lines of Code</p>
                <p
                  className="cursor-pointer text-base font-semibold text-slate-900 hover:text-blue-600"
                  onClick={() => onLinesOfCodeClick && onLinesOfCodeClick()}
                >
                  {getReportInfo("linesOfCode")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Date */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Report Date</p>
                <p className="text-base font-semibold text-slate-900">{getReportInfo("reportDate")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Gate Status - only show if status exists */}
      {reportDetails?.qualityGateStatus && reportDetails.qualityGateStatus !== "NONE" && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-blue-600" />
              Quality Gate Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3">
              {reportDetails?.qualityGateStatus === "OK" ? (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-emerald-700">Passed</p>
                    <p className="text-sm text-slate-600">This project meets all quality gate requirements</p>
                  </div>
                </>
              ) : reportDetails?.qualityGateStatus === "ERROR" ? (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-red-700">Failed</p>
                    <p className="text-sm text-slate-600">This project does not meet quality gate requirements</p>
                  </div>
                </>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reportMetricsConfig.map((card) => {
          const value = reportDetails?.[card.key] || 0;
          const rating = reportDetails?.[card.ratingKey] || "";

          const handleClick = () => {
            const filterMap = { bugs: "BUG", vulnerabilities: "VULNERABILITY", codeSmells: "CODE_SMELL" };
            const filterType = filterMap[card.key];
            if (filterType && onMetricClick) onMetricClick(filterType);
          };

          return (
            <Card key={card.key} className="metric-card border-slate-200 transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium text-slate-700">{card.title}</CardTitle>
                  {rating && (
                    <Badge 
                      className={`${getRatingColor(rating)} text-base px-3 py-1 font-bold cursor-help`}
                      title={getRatingDescription(card.ratingKey, rating)}
                    >
                      {rating}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500">{card.metricLabel}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-baseline justify-between">
                  <span
                    className="cursor-pointer text-3xl font-bold text-slate-900 hover:text-blue-600"
                    onClick={handleClick}
                  >
                    {value}
                  </span>
                  <div className="text-slate-400">{card.icon}</div>
                </div>
                {rating && categoryByRatingKey[card.ratingKey] && (
                  <p className="mt-2 text-xs text-slate-500">
                    {getRatingDescription(card.ratingKey, rating)}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-slate-200 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              Issues by Severity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <IssuesSeverityChart
              data={reportDetails?.issuesBySeverity}
              onIssueCountClick={(type, severity) => onMetricClick && onMetricClick({ type, severity })}
            />
          </CardContent>
        </Card>

        {bottomMetricsConfig
          .filter((item) => item.key !== "issuesBySeverity")
          .map((item) => {
            const value =
              item.metricKey && reportDetails?.[item.metricKey] !== undefined
                ? parseFloat(reportDetails[item.metricKey])
                : null;

            return (
              <Card key={item.key} className="border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {value !== null ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold text-slate-900">{value.toFixed(1)}%</span>
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full ${
                            value >= 80 ? "bg-emerald-100 text-emerald-600" : value >= 60 ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600"
                          }`}
                        >
                          {value >= 80 ? <CheckCircle className="h-6 w-6" /> : value >= 60 ? <AlertTriangle className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                        </div>
                      </div>
                      <Progress value={value} className="h-2" />
                      <p className="text-xs text-slate-500">
                        {value >= 80 ? "Excellent" : value >= 60 ? "Moderate - improvement recommended" : "Poor - immediate attention needed"}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-slate-400">
                      <Info className="mr-2 h-5 w-5" />
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
};

export default SummaryView;
