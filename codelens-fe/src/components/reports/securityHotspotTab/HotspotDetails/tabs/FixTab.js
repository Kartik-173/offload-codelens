import React from "react";

const FixTab = ({ hotspot }) => {
  if (!hotspot?.rule?.fixRecommendations) {
    return (
      <div className="fix-tab-empty p-2 text-sm text-slate-500">
        No fix recommendations available.
      </div>
    );
  }

  const createMarkup = (html) => ({ __html: html });

  return (
    <div
      className="tab-content-wrapper"
      dangerouslySetInnerHTML={createMarkup(hotspot.rule.fixRecommendations)}
    />
  );
};

export default FixTab;
