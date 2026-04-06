import React from "react";

const ActivityTab = ({ hotspot }) => {
  if (!hotspot) return null;

  const { author, creationDate } = hotspot;

  const formattedDate = new Date(creationDate).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="activity-tab-wrapper">
      <h3 className="activity-title text-lg font-semibold">
        Activity
      </h3>

      <button type="button" className="add-comment-btn rounded-md border px-2 py-1 text-sm hover:bg-slate-50">
        Add a comment
      </button>

      <div className="activity-item">
        <div className="activity-avatar flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-medium">
          {author ? author[0].toUpperCase() : "U"}
        </div>
        <div className="activity-content">
          <p className="activity-date text-xs text-slate-500">{formattedDate}</p>
          <p className="activity-text text-sm">
            <span className="activity-author">{author}</span> created Security
            Hotspot
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActivityTab;
