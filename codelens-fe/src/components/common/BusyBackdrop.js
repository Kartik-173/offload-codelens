import React from "react";

const BusyBackdrop = ({ open, text = "Please wait...", size = 28 }) => {
  if (!open) return null;

  return (
    <div className="busy-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="busy-backdrop-content flex items-center rounded-md bg-slate-900 px-4 py-3 text-white shadow-lg">
        <div
          className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-white"
          style={{ width: size, height: size }}
        />
        {text ? (
          <span className="busy-backdrop-text ml-2 text-sm" aria-live="polite">
            {text}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default BusyBackdrop;
