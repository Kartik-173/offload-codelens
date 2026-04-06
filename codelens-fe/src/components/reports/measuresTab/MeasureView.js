import React, { useState } from "react";
import { ChevronDown as ExpandMoreIcon, Folder as FolderIcon } from "lucide-react";

const Box = ({ children, className = "" }) => <div className={className}>{children}</div>;
const Typography = ({ children, className = "" }) => <p className={className}>{children}</p>;

const measureData = [
  {
    title: "Project Overview",
    subItems: []
  },
  {
    title: "Security", subItems: ["Overview", "Overall Code", "Vulnerabilities", "Rating", "Remediation Effort"]
  },
  { title: "Reliability", subItems: ["Overview", "Overall Code", "Vulnerabilities", "Rating", "Remediation Effort"] },
  { title: "Maintainability", subItems: ["Overview", "Overall Code", "Code Smells", "Debt", "Debt Ratio", "Rating", "Effort to Reach A"] },
  { title: "Security Review", subItems: ["Overall Code", "Security Hotspots", "Rating", "Hotspots Reviewed"] },
  { title: "Duplications", subItems: ["Overview", "Overall Code", "Density", "Duplicated Lines", "Duplicated Blocks", "Duplicated Files"] },
  { title: "Size", subItems: ["Lines of Code", "Lines", "Files", "Comment Lines", "Comments (%)"] },
  { title: "Complexity", subItems: ["Cyclomatic Complexity", "Cognitive Complexity"] },
  { title: "Issues", subItems: ["Issues", "Confirmed Issues", "False Positive Issues", "Accepted Issues"] }
];

const MeasureView = () => {
  const [selectedSubItem, setSelectedSubItem] = useState(null);
  const [viewMode, setViewMode] = useState("Tree");

  return (
    <Box className="measure-view-container">
      {/* Left Panel */}
      <Box className="measure-left-panel">
        {measureData.map((section, idx) => (
          <details key={idx} className="measure-accordion" open>
            <summary className="flex cursor-pointer list-none items-center justify-between">
              <Typography className="measure-section-title">{section.title}</Typography>
              <ExpandMoreIcon className="h-4 w-4" />
            </summary>
            {section.subItems.length > 0 && (
              <div className="measure-subitems">
                <div>
                  {section.subItems.map((sub, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`measure-subitem-btn ${
                        selectedSubItem === sub ? "selected" : ""
                      }`}
                      onClick={() => setSelectedSubItem(sub)}
                    >
                      <span>{sub}</span>
                      <Typography>
                        0
                      </Typography>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </details>
        ))}
      </Box>

      {/* Right Panel */}
      <Box className="measure-right-panel">
        <Box className="measure-header">
          <Typography className="measure-path">
            examples › framework-boilerplates
          </Typography>
          <Box className="measure-header-actions">
            <Typography>View as</Typography>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="measure-view-select h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="Tree">Tree</option>
              <option value="Chart">Chart</option>
            </select>
            <Typography className="measure-file-count">
              47 files
            </Typography>
          </Box>
        </Box>

        <Box className="measure-content">
          {viewMode === "Tree" ? (
            <div>
              {[
                "angular",
                "astro",
                "blitzjs",
                "brunch",
                "create-react-app",
                "docusaurus",
                "ember",
                "gatsby"
              ].map((folder, i) => (
                <button type="button" key={i} className="measure-folder-item">
                  <FolderIcon className="measure-folder-icon" />
                  <span>{folder}</span>
                  <Typography>0</Typography>
                </button>
              ))}
            </div>
          ) : (
            <Box className="measure-chart-placeholder">
              <Typography>
                Chart placeholder (e.g., Lines of Code vs Technical Debt)
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default MeasureView;
