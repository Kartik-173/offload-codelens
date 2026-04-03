import React from "react";
import { Box, Typography } from "@mui/material";

const FixTab = ({ hotspot }) => {
  if (!hotspot?.rule?.fixRecommendations) {
    return (
      <Box className="fix-tab-empty" sx={{ p: 2 }}>
        <Typography variant="body1" color="textSecondary">
          No fix recommendations available.
        </Typography>
      </Box>
    );
  }

  const createMarkup = (html) => ({ __html: html });

  return (
      <Box
        className="tab-content-wrapper"
        component="div"
        dangerouslySetInnerHTML={createMarkup(hotspot.rule.fixRecommendations)}
      />
  );
};

export default FixTab;
