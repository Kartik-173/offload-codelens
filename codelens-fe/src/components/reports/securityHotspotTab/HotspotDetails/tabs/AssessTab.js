import React from "react";
import { Box, Typography } from "@mui/material";

const AssessTab = ({ hotspot }) => {
  if (!hotspot?.rule?.vulnerabilityDescription) {
    return (
      <Box className="assess-tab-empty" sx={{ p: 2 }}>
        <Typography variant="body1" color="textSecondary">
          No assessment details available.
        </Typography>
      </Box>
    );
  }

  const createMarkup = (html) => ({ __html: html });

  return (
    <Box
      className="tab-content-wrapper"
      component="div"
      dangerouslySetInnerHTML={createMarkup(
        hotspot.rule.vulnerabilityDescription
      )}
    />
  );
};

export default AssessTab;
