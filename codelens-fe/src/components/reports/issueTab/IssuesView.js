import React, { useState, useEffect } from "react";
import {
  List,
  ListItem,
  ListItemText,
  Collapse,
  Checkbox,
  FormControlLabel,
  Typography,
  Button,
  IconButton,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  NavigateBefore,
  NavigateNext,
  KeyboardArrowUp,
  KeyboardArrowDown,
} from "@mui/icons-material";

const filterGroups = [
  {
    title: "Software Quality",
    key: "softwareQuality",
    items: [
      { name: "Security", key: "security" },
      { name: "Reliability", key: "reliability" },
      { name: "Maintainability", key: "maintainability" },
    ],
  },
  {
    title: "Severity",
    key: "severity",
    items: [
      { name: "Blocker", key: "blocker" },
      { name: "Critical", key: "critical" },
      { name: "Major", key: "major" },
      { name: "Minor", key: "minor" },
      { name: "Info", key: "info" },
    ],
  },
  {
    title: "Clean Code Attribute",
    key: "cleanCode",
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

  const renderFilters = (items) => (
    <List dense>
      {items.map((item) => (
        <ListItem key={item.key}>
          <FormControlLabel
            control={
              <Checkbox
                checked={!!filters[item.key]}
                onChange={() =>
                  setFilters((prev) => ({
                    ...prev,
                    [item.key]: !prev[item.key],
                  }))
                }
                size="small"
              />
            }
            label={<span>{item.name}</span>}
          />
        </ListItem>
      ))}
    </List>
  );

  if (loading) {
    return (
      <div className="issues-loading">
        <CircularProgress />
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
    <div className="issues-view">
      <div className="issues-sidebar">
        {filterGroups.map((group) => (
          <div key={group.key}>
            <ListItem button onClick={() => toggleSection(group.key)}>
              <ListItemText primary={group.title} />
              {expandedSections[group.key] ? <ExpandLess /> : <ExpandMore />}
            </ListItem>
            <Collapse in={expandedSections[group.key]}>
              {renderFilters(group.items)}
            </Collapse>
          </div>
        ))}
      </div>

      <div className="issues-content">
        <div className="issues-action-bar">
          <div className="action-left">
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedIssues.length === issues.length}
                  indeterminate={
                    selectedIssues.length > 0 &&
                    selectedIssues.length < issues.length
                  }
                  onChange={handleSelectAll}
                />
              }
              label=""
            />
            {selectedIssues.length > 0 && (
              <Button className="bulk-change-btn">Bulk Change</Button>
            )}
          </div>

          <div className="action-right">
            <Typography variant="body2">Navigate to issue</Typography>
            <div className="navigate-controls">
              <IconButton size="small"><NavigateBefore /></IconButton>
              <IconButton size="small"><KeyboardArrowUp /></IconButton>
              <IconButton size="small"><KeyboardArrowDown /></IconButton>
              <IconButton size="small"><NavigateNext /></IconButton>
            </div>
          </div>
        </div>

        <div className="issues-list">
          {visibleIssues.map((issue) => (
            <div key={issue.id} className="issue-item">
              <div className="issue-top-row">
                <span className="file-path">{issue.file}</span>
              </div>
              <div className="issue-bottom-row">
                <div className="issue-checkbox">
                  <Checkbox
                    checked={selectedIssues.includes(issue.id)}
                    onChange={() => handleIssueSelection(issue.id)}
                  />
                </div>
                <div className="issue-content">
                  <div className="issue-section">
                    <div className="issue-title">{issue.title}</div>
                    <div className="issue-tags">
                      {issue.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          className="tag-chip"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="issue-section issue-second-row">
                    <div className="issue-left">
                      <Chip
                        label={issue.category}
                        size="small"
                        className={`category-chip chip-${issue.severity.toLowerCase()}`}
                      />
                      <Chip
                        label={issue.severity}
                        size="small"
                        className={`severity-chip chip-${issue.severity.toLowerCase()}`}
                      />
                    </div>
                    <div className="issue-meta">
                      {issue.line && <span>L:{issue.line}</span>}
                      {issue.effort && <span>{issue.effort} effort</span>}
                      {issue.age && <span>{issue.age}</span>}
                      {issue.impact && <span>{issue.impact}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="issues-footer">
            <Typography variant="body2">
              {`${visibleIssues.length} of ${filteredIssues.length} shown`}
            </Typography>
            {visibleIssues.length < filteredIssues.length && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => setVisibleCount((prev) => prev + 100)}
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
