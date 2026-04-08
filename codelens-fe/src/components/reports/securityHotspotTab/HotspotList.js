import React from "react";
import { ChevronDown, ChevronUp, Shield } from "lucide-react";
import { Badge } from "../../ui/badge";

const priorityIcons = {
  HIGH: <ChevronUp className="h-4 w-4 text-red-500" />,
  MEDIUM: <ChevronUp className="h-4 w-4 text-orange-500" />,
  LOW: <ChevronDown className="h-4 w-4 text-blue-500" />,
};

const priorityConfig = {
  HIGH: { color: "bg-red-50 text-red-700 border-red-200", iconColor: "text-red-500", label: "High" },
  MEDIUM: { color: "bg-orange-50 text-orange-700 border-orange-200", iconColor: "text-orange-500", label: "Medium" },
  LOW: { color: "bg-blue-50 text-blue-700 border-blue-200", iconColor: "text-blue-500", label: "Low" },
};

const statusConfig = {
  TO_REVIEW: { label: "To review", color: "bg-amber-50 text-amber-700 border-amber-200" },
  ACKNOWLEDGED: { label: "Acknowledged", color: "bg-blue-50 text-blue-700 border-blue-200" },
  FIXED: { label: "Fixed", color: "bg-green-50 text-green-700 border-green-200" },
  SAFE: { label: "Safe", color: "bg-slate-50 text-slate-600 border-slate-200" },
};

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
    <div className="space-y-4 px-4 pb-4 h-full overflow-y-auto">
      {/* Status Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-3">
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
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              selectedTab === tab.value
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Shield className="h-4 w-4 text-slate-400" />
        <span>
          <span className="font-semibold text-slate-900">{filteredHotspots.length}</span> Security Hotspots to review
        </span>
      </div>

      {/* Grouped List */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([priority, categories]) => (
          <div key={priority} className="space-y-2">
            {/* Priority Header */}
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span className="text-slate-500">Review priority:</span>
              {priorityIcons[priority]}
              <Badge 
                variant="outline" 
                className={`text-xs font-medium ${priorityConfig[priority]?.color || "bg-slate-50 text-slate-600"}`}
              >
                {priority}
              </Badge>
            </div>

            {/* Categories */}
            {Object.entries(categories).map(([category, items]) => {
              const key = `${priority}-${category}`;
              const expanded = expandedCategories[key];

              return (
                <div key={category} className="ml-2 border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button
                    type="button"
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                      expanded ? "bg-slate-50" : "bg-white hover:bg-slate-50"
                    }`}
                    onClick={() => toggleCategory(priority, category)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">{category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs font-medium bg-slate-100 text-slate-600">
                        {items.length}
                      </Badge>
                      {expanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-slate-200">
                      {items.map((h) => (
                        <button
                          key={h.key}
                          type="button"
                          onClick={() => {
                            setSelectedHotspotKey(h.key);
                            setSelectedHotspot(h);
                          }}
                          className={`w-full text-left px-3 py-3 text-sm transition-colors border-l-2 ${
                            selectedHotspotKey === h.key
                              ? "bg-blue-50 text-blue-700 border-l-blue-500"
                              : "text-slate-700 hover:bg-slate-50 border-l-transparent"
                          }`}
                        >
                          <p className="line-clamp-2 font-medium">{h.message}</p>
                          {h.component?.path && (
                            <p className="text-xs text-slate-400 mt-1.5 truncate font-mono">
                              {h.component.path}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      {filteredHotspots.length > 0 && (
        <p className="text-xs text-slate-400 text-center pt-2">
          {filteredHotspots.length} of {filteredHotspots.length} shown
        </p>
      )}
    </div>
  );
};

export default HotspotList;
