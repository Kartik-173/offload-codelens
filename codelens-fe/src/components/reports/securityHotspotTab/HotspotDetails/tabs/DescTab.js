import React from "react";
import { Box, Typography } from "@mui/material";

const DescTab = ({ hotspot }) => {
  if (!hotspot?.rule) return null;

  const { riskDescription, vulnerabilityDescription } = hotspot.rule;

  // Clean up the HTML coming from API
  const createMarkup = (html) => ({ __html: html });

  return (
    <Box className="desc-tab-wrapper">
      {/* Risk description */}
      {riskDescription && (
        <Typography
          className="desc-tab-risk"
          component="div"
          dangerouslySetInnerHTML={createMarkup(riskDescription)}
        />
      )}

      {/* Vulnerability description (Ask Yourself, Examples, etc.) */}
      {vulnerabilityDescription && (
        <Box
          className="tab-content-wrapper"
          dangerouslySetInnerHTML={createMarkup(vulnerabilityDescription)}
        />
      )}
    </Box>
  );
};

export default DescTab;
