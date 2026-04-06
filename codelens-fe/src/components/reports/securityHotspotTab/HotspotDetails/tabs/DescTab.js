import React from "react";

const DescTab = ({ hotspot }) => {
  if (!hotspot?.rule) return null;

  const { riskDescription, vulnerabilityDescription } = hotspot.rule;

  // Clean up the HTML coming from API
  const createMarkup = (html) => ({ __html: html });

  return (
    <div className="desc-tab-wrapper">
      {/* Risk description */}
      {riskDescription && (
        <div
          className="desc-tab-risk"
          dangerouslySetInnerHTML={createMarkup(riskDescription)}
        />
      )}

      {/* Vulnerability description (Ask Yourself, Examples, etc.) */}
      {vulnerabilityDescription && (
        <div
          className="tab-content-wrapper"
          dangerouslySetInnerHTML={createMarkup(vulnerabilityDescription)}
        />
      )}
    </div>
  );
};

export default DescTab;
