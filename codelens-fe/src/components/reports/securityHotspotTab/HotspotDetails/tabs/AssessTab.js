import React from "react";

const AssessTab = ({ hotspot }) => {
  if (!hotspot?.rule?.vulnerabilityDescription) {
    return (
      <div className="assess-tab-empty p-2 text-sm text-slate-500">
        No assessment details available.
      </div>
    );
  }

  const createMarkup = (html) => ({ __html: html });

  return (
    <div
      className="tab-content-wrapper"
      dangerouslySetInnerHTML={createMarkup(
        hotspot.rule.vulnerabilityDescription
      )}
    />
  );
};

export default AssessTab;
