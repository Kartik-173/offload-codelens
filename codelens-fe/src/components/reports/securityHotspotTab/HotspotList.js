import React from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { getPriorityIcon } from "../../../utils/Helpers.js";

const HotspotList = ({
  selectedTab,
  handleTabChange,
  grouped,
  expandedCategories,
  toggleCategory,
  filteredHotspots,
  selectedHotspotKey,
  setSelectedHotspotKey,
  setSelectedHotspot,
}) => {
  return (
    <Paper className="hotspot-list">
      <Tabs
        value={selectedTab}
        onChange={handleTabChange}
        className="hotspot-tabs"
      >
        <Tab value="TO_REVIEW" label="To review" />
        <Tab value="ACKNOWLEDGED" label="Acknowledged" />
        <Tab value="FIXED" label="Fixed" />
        <Tab value="SAFE" label="Safe" />
      </Tabs>

      <Divider />

      <Typography variant="body2" className="hotspot-count-box">
        <span className="hotspot-count">{filteredHotspots.length}</span> Security
        Hotspots to review
      </Typography>

      {Object.entries(grouped).map(([priority, categories]) => (
        <Box key={priority} className="priority-section">
          <Typography variant="subtitle2" className="priority-title">
            Review priority: {getPriorityIcon(priority)}
            <span className="priority-text">{priority}</span>
          </Typography>

          {Object.entries(categories).map(([category, items]) => {
            const key = `${priority}-${category}`;
            const expanded = expandedCategories[key];

            return (
              <Box key={category} className="category-box">
                <Box
                  className={`category-header ${expanded ? "selected" : ""}`}
                  onClick={() => toggleCategory(priority, category)}
                >
                  <Box className="category-left">
                    {getPriorityIcon(priority)}
                    <Typography className="category-title">
                      {category}
                    </Typography>
                  </Box>
                  <Box className="category-right">
                    <Typography className="category-count">
                      {items.length}
                    </Typography>
                    {expanded ? (
                      <ExpandLessIcon fontSize="small" />
                    ) : (
                      <ExpandMoreIcon fontSize="small" />
                    )}
                  </Box>
                </Box>

                {expanded && (
                  <List disablePadding>
                    {items.map((h) => (
                      <ListItem
                        key={h.key}
                        button
                        onClick={() => {
                          setSelectedHotspotKey(h.key);
                          setSelectedHotspot(h);   
                        }}
                        className={`hotspot-list-item ${
                          selectedHotspotKey === h.key ? "selected" : ""
                        }`}
                      >
                        <ListItemText primary={h.message} />
                      </ListItem>

                    ))}
                  </List>
                )}
              </Box>
            );
          })}
        </Box>
      ))}

      <Typography variant="body2" className="hotspot-footer">
        {filteredHotspots.length} of {filteredHotspots.length} shown
      </Typography>
    </Paper>
  );
};

export default HotspotList;
