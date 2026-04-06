import React from "react";
import { MoreVertical } from "lucide-react";

const MetricMenu = () => {
  return (
    <details className="relative">
      <summary className="file-view-metric-menu-button list-none cursor-pointer rounded p-1 hover:bg-slate-100">
        <MoreVertical className="h-4 w-4" />
      </summary>
      <div className="absolute right-0 z-10 mt-1 min-w-44 rounded-md border bg-white p-1 shadow">
        <button type="button" className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-100">Open in New Window</button>
        <button type="button" className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-100">Pin This File</button>
        <button type="button" className="block w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-100">Show Raw Source</button>
      </div>
    </details>
  );
};

export default MetricMenu;
