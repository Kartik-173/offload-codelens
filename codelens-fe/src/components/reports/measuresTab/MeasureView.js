import React, { useState } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItemButton,
  ListItemText,
  Select,
  MenuItem
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderIcon from "@mui/icons-material/Folder";

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
          <Accordion key={idx} className="measure-accordion">
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2" className="measure-section-title">{section.title}</Typography>
            </AccordionSummary>
            {section.subItems.length > 0 && (
              <AccordionDetails className="measure-subitems">
                <List dense>
                  {section.subItems.map((sub, i) => (
                    <ListItemButton
                      key={i}
                      className={`measure-subitem-btn ${
                        selectedSubItem === sub ? "selected" : ""
                      }`}
                      onClick={() => setSelectedSubItem(sub)}
                    >
                      <ListItemText primary={sub} />
                      <Typography variant="body2" color="textSecondary">
                        0
                      </Typography>
                    </ListItemButton>
                  ))}
                </List>
              </AccordionDetails>
            )}
          </Accordion>
        ))}
      </Box>

      {/* Right Panel */}
      <Box className="measure-right-panel">
        <Box className="measure-header">
          <Typography variant="body1" className="measure-path">
            examples › framework-boilerplates
          </Typography>
          <Box className="measure-header-actions">
            <Typography variant="body2">View as</Typography>
            <Select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              size="small"
              className="measure-view-select"
            >
              <MenuItem value="Tree">Tree</MenuItem>
              <MenuItem value="Chart">Chart</MenuItem>
            </Select>
            <Typography variant="body2" className="measure-file-count">
              47 files
            </Typography>
          </Box>
        </Box>

        <Box className="measure-content">
          {viewMode === "Tree" ? (
            <List>
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
                <ListItemButton key={i} className="measure-folder-item">
                  <FolderIcon className="measure-folder-icon" />
                  <ListItemText primary={folder} />
                  <Typography variant="body2">0</Typography>
                </ListItemButton>
              ))}
            </List>
          ) : (
            <Box className="measure-chart-placeholder">
              <Typography variant="body2">
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
