import React from "react";
import { Copy } from "lucide-react";

const HotspotHeader = ({ hotspot, handleCopyPath, getPriorityIcon }) => {
  return (
    <div className="hotspot-header">
      <div className="hotspot-summary-text">
        <h3 className="hotspot-summary-title text-lg font-semibold">
          {hotspot.message}
          <Copy
            onClick={handleCopyPath}
            className="file-view-copy-icon ml-2 inline h-4 w-4 cursor-pointer"
          />
        </h3>

        <p className="hotspot-summary-subtitle text-sm text-slate-600">
          {hotspot.rule.name} {hotspot.rule.key}
        </p>

        <div className="hotspot-summary-status">
          <div className="hotspot-summary-text-box">
            <p className="hotspot-status-text">
              Status: {hotspot.status}
            </p>
            <p className="hotspot-status-desc text-sm text-slate-600">
              This security hotspot needs to be reviewed to assess whether the
              code poses a risk.
            </p>
          </div>

          <button type="button" className="review-btn rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">
            Review
          </button>
        </div>
      </div>

      <div className="hotspot-summary-meta">
        <div className="meta-item">
          <p className="meta-label">Review priority:</p>
          <p className="meta-value">
            {getPriorityIcon(hotspot.rule.vulnerabilityProbability)}
            {hotspot.rule.vulnerabilityProbability}
          </p>
        </div>

        <div className="meta-item">
          <p className="meta-label">Category:</p>
          <p className="meta-value">{hotspot.rule.securityCategory}</p>
        </div>

        <div className="meta-item">
          <p className="meta-label">Assignee:</p>
          <p className="meta-value">Not assigned</p>
        </div>
      </div>
    </div>
  );
};

export default HotspotHeader;
