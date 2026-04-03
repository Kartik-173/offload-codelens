import React from "react";
import { Box, Typography, Avatar, Button } from "@mui/material";

const ActivityTab = ({ hotspot }) => {
  if (!hotspot) return null;

  const { author, creationDate } = hotspot;

  const formattedDate = new Date(creationDate).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Box className="activity-tab-wrapper">
      <Typography variant="h6" className="activity-title">
        Activity
      </Typography>

      <Button variant="outlined" size="small" className="add-comment-btn">
        Add a comment
      </Button>

      <Box className="activity-item">
        <Avatar className="activity-avatar">
          {author ? author[0].toUpperCase() : "U"}
        </Avatar>
        <Box className="activity-content">
          <Typography className="activity-date">
            {formattedDate}
          </Typography>
          <Typography className="activity-text">
            <span className="activity-author">{author}</span> created Security
            Hotspot
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ActivityTab;
