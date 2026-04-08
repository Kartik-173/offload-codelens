import React, { useState, useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Filter,
  Shield,
  Bug,
  Wrench,
  AlertCircle,
  FileCode,
  Clock,
  X,
  Check,
  Minus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";

const filterGroups = [
  {
    title: "Software Quality",
    key: "softwareQuality",
    icon: <Shield className="h-4 w-4" />,
    items: [
      { name: "Security", key: "security", icon: <Shield className="h-3 w-3 text-purple-500" /> },
      { name: "Reliability", key: "reliability", icon: <Bug className="h-3 w-3 text-red-500" /> },
      { name: "Maintainability", key: "maintainability", icon: <Wrench className="h-3 w-3 text-blue-500" /> },
    ],
  },
  {
    title: "Severity",
    key: "severity",
    icon: <AlertCircle className="h-4 w-4" />,
    items: [
      { name: "Blocker", key: "blocker", color: "bg-red-600" },
      { name: "Critical", key: "critical", color: "bg-red-500" },
      { name: "Major", key: "major", color: "bg-orange-500" },
      { name: "Minor", key: "minor", color: "bg-blue-500" },
      { name: "Info", key: "info", color: "bg-slate-400" },
    ],
  },
  {
    title: "Clean Code Attribute",
    key: "cleanCode",
    icon: <FileCode className="h-4 w-4" />,
    items: [
      { name: "Consistency", key: "consistency" },
      { name: "Intentionality", key: "intentionality" },
      { name: "Adaptability", key: "adaptability" },
      { name: "Responsibility", key: "responsibility" },
    ],
  },
];

const categoryMapping = {
  VULNERABILITY: "security",
  BUG: "reliability",
  CODE_SMELL: "maintainability",
};

const severityColors = {
  BLOCKER: "bg-red-50 text-red-700 border-red-200",
  CRITICAL: "bg-red-50 text-red-700 border-red-200",
  MAJOR: "bg-orange-50 text-orange-700 border-orange-200",
  MINOR: "bg-blue-50 text-blue-700 border-blue-200",
  INFO: "bg-slate-50 text-slate-600 border-slate-200",
};

const categoryColors = {
  Security: "bg-purple-50 text-purple-700 border-purple-200",
  Reliability: "bg-red-50 text-red-700 border-red-200",
  Maintainability: "bg-blue-50 text-blue-700 border-blue-200",
};

const severityDotColors = {
  BLOCKER: "bg-red-600",
  CRITICAL: "bg-red-500",
  MAJOR: "bg-orange-500",
  MINOR: "bg-blue-500",
  INFO: "bg-slate-400",
};

const formatAge = (creationDate) => {
  if (!creationDate) return "";
  const created = new Date(creationDate);
  const now = new Date();
  const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  return diffDays === 0 ? "Today" : `${diffDays}d ago`;
};

export default function IssuesView({ loading, reportDetails, issueFilter }) {
  const [expandedSections, setExpandedSections] = useState(
    Object.fromEntries(filterGroups.map((g) => [g.key, true]))
  );
  const [filters, setFilters] = useState({});
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [visibleCount, setVisibleCount] = useState(100);

  const issues = (reportDetails?.issues || []).map((issue) => ({
    id: issue.key || issue.id,
    title: issue.message,
    category:
      issue.type === "VULNERABILITY"
        ? "Security"
        : issue.type === "BUG"
        ? "Reliability"
        : "Maintainability",
    severity: issue.severity,
    status: issue.status,
    file: issue.component,
    line: issue.line,
    effort: issue.effort,
    type: issue.type,
    tags: issue.tags || [],
    age: formatAge(issue.creationDate),
    impact: issue.impact || "",
  }));

  useEffect(() => {
    if (!issueFilter) return;
    // Accept legacy string (type) or object { type, severity }
    if (typeof issueFilter === 'string') {
      const mappedKey = categoryMapping[issueFilter.toUpperCase()] || null;
      if (mappedKey) setFilters((prev) => ({ ...prev, [mappedKey]: true }));
      return;
    }
    const { type, severity } = issueFilter || {};
    const mappedKey = type ? categoryMapping[String(type).toUpperCase()] : null;
    setFilters((prev) => ({
      ...prev,
      ...(mappedKey ? { [mappedKey]: true } : {}),
      ...(severity ? { [String(severity).toLowerCase()]: true } : {}),
    }));
  }, [issueFilter]);

  const toggleSection = (key) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAll = () => {
    if (selectedIssues.length === issues.length) {
      setSelectedIssues([]);
    } else {
      setSelectedIssues(issues.map((i) => i.id));
    }
  };

  const handleIssueSelection = (id) => {
    setSelectedIssues((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setFilters({});
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  // Custom checkbox for select all with indeterminate state
  const SelectAllCheckbox = () => {
    const allSelected = selectedIssues.length === issues.length && issues.length > 0;
    const someSelected = selectedIssues.length > 0 && !allSelected;
    
    return (
      <button
        onClick={handleSelectAll}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <div className="h-4 w-4 rounded border border-slate-300 flex items-center justify-center bg-white">
          {allSelected && <Check className="h-3 w-3 text-slate-700" />}
          {someSelected && <Minus className="h-3 w-3 text-slate-700" />}
        </div>
        <span>
          {selectedIssues.length > 0
            ? `${selectedIssues.length} selected`
            : "Select all"}
        </span>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
      </div>
    );
  }

  const filteredIssues = issues.filter((issue) => {
    const activeKeys = Object.keys(filters).filter((k) => filters[k]);
    if (activeKeys.length === 0) return true;
    const issueCategory = String(issue.category || "").toLowerCase();
    const issueSeverity = String(issue.severity || "").toLowerCase();
    return activeKeys.some((key) => {
      const lk = String(key).toLowerCase();
      return issueCategory.includes(lk) || issueSeverity === lk;
    });
  });

  const visibleIssues = filteredIssues.slice(0, visibleCount);

  return (
    <div className="issues-view flex gap-6">
      {/* Sidebar Filters */}
      <div className="w-64 flex-shrink-0 space-y-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4 text-slate-500" />
                Filters
              </CardTitle>
              {activeFiltersCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters} 
                  className="h-6 px-2 text-xs text-slate-500 hover:text-slate-700"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {filterGroups.map((group) => (
                <div key={group.key} className="border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                  <button
                    onClick={() => toggleSection(group.key)}
                    className="flex w-full items-center justify-between py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                  >
                    <div className="flex items-center gap-2">
                      {group.icon}
                      {group.title}
                    </div>
                    {expandedSections[group.key] ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                  {expandedSections[group.key] && (
                    <div className="mt-1 space-y-0.5 pl-6">
                      {group.items.map((item) => (
                        <label
                          key={item.key}
                          className="flex items-center gap-2 py-1.5 text-sm text-slate-600 hover:text-slate-900 cursor-pointer"
                        >
                          <Checkbox
                            checked={!!filters[item.key]}
                            onCheckedChange={() =>
                              setFilters((prev) => ({
                                ...prev,
                                [item.key]: !prev[item.key],
                              }))
                            }
                          />
                          <div className="flex items-center gap-2">
                            {item.color && (
                              <span className={`h-2 w-2 rounded-full ${item.color}`}></span>
                            )}
                            {item.icon}
                            <span>{item.name}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Action Bar */}
        <Card className="border-slate-200 mb-4">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SelectAllCheckbox />
                {selectedIssues.length > 0 && (
                  <Button size="sm" variant="outline">
                    Bulk Change
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>Navigate</span>
                <div className="flex items-center gap-0.5">
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Issues List */}
        <div className="space-y-3">
          {visibleIssues.map((issue) => (
            <Card
              key={issue.id}
              className="border-slate-200 hover:border-slate-300 transition-colors"
            >
              <CardContent className="p-4">
                {/* File Path */}
                <div className="flex items-center gap-2 mb-3 text-sm text-slate-500">
                  <FileCode className="h-4 w-4" />
                  <span className="font-mono text-xs truncate">{issue.file}</span>
                  {issue.line && (
                    <Badge variant="outline" className="text-xs font-mono">
                      L{issue.line}
                    </Badge>
                  )}
                </div>

                {/* Main Content */}
                <div className="flex gap-3">
                  <div className="pt-0.5">
                    <Checkbox
                      checked={selectedIssues.includes(issue.id)}
                      onCheckedChange={() => handleIssueSelection(issue.id)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <p className="text-sm font-medium text-slate-900 mb-2">
                      {issue.title}
                    </p>

                    {/* Tags */}
                    {issue.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {issue.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs px-2 py-0.5 font-normal"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Meta Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium ${categoryColors[issue.category] || "bg-slate-50 text-slate-600 border-slate-200"}`}
                      >
                        {issue.category}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium ${severityColors[issue.severity] || "bg-slate-50 text-slate-600 border-slate-200"}`}
                      >
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${severityDotColors[issue.severity]} mr-1.5`}></span>
                        {issue.severity}
                      </Badge>
                      {issue.effort && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          {issue.effort}
                        </div>
                      )}
                      {issue.age && (
                        <span className="text-xs text-slate-400">{issue.age}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-slate-500">
              Showing <span className="font-medium">{visibleIssues.length}</span> of <span className="font-medium">{filteredIssues.length}</span> issues
            </p>
            {visibleIssues.length < filteredIssues.length && (
              <Button
                onClick={() => setVisibleCount((prev) => prev + 100)}
                variant="outline"
              >
                Show More
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
