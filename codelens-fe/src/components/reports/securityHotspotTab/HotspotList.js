import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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
    <div className="hotspot-list rounded-md border bg-card">
      <div className="hotspot-tabs flex flex-wrap border-b">
        {[
          { value: "TO_REVIEW", label: "To review" },
          { value: "ACKNOWLEDGED", label: "Acknowledged" },
          { value: "FIXED", label: "Fixed" },
          { value: "SAFE", label: "Safe" },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={(e) => handleTabChange(e, tab.value)}
            className={`border-b-2 px-4 py-2 text-sm ${
              selectedTab === tab.value
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="hotspot-count-box text-sm">
        <span className="hotspot-count">{filteredHotspots.length}</span> Security
        Hotspots to review
      </p>

      {Object.entries(grouped).map(([priority, categories]) => (
        <div key={priority} className="priority-section">
          <p className="priority-title text-sm font-semibold">
            Review priority: {getPriorityIcon(priority)}
            <span className="priority-text">{priority}</span>
          </p>

          {Object.entries(categories).map(([category, items]) => {
            const key = `${priority}-${category}`;
            const expanded = expandedCategories[key];

            return (
              <div key={category} className="category-box">
                <button
                  type="button"
                  className={`category-header ${expanded ? "selected" : ""}`}
                  onClick={() => toggleCategory(priority, category)}
                >
                  <div className="category-left">
                    {getPriorityIcon(priority)}
                    <span className="category-title">{category}</span>
                  </div>
                  <div className="category-right">
                    <span className="category-count">{items.length}</span>
                    {expanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {expanded && (
                  <ul className="list-none p-0">
                    {items.map((h) => (
                      <li
                        key={h.key}
                        onClick={() => {
                          setSelectedHotspotKey(h.key);
                          setSelectedHotspot(h);   
                        }}
                        className={`hotspot-list-item ${
                          selectedHotspotKey === h.key ? "selected" : ""
                        }`}
                      >
                        {h.message}
                      </li>

                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <p className="hotspot-footer text-sm">
        {filteredHotspots.length} of {filteredHotspots.length} shown
      </p>
    </div>
  );
};

export default HotspotList;
