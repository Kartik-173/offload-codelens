import React from "react";
import { ChevronDown as ExpandMoreIcon, X as CloseIcon } from "lucide-react";
import ScanProgress from "../common/ScanProgress";

const Box = ({ children, className = "" }) => <div className={className}>{children}</div>;
const Typography = ({ children, className = "" }) => <p className={className}>{children}</p>;
const Chip = ({ label, className = "" }) => <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs ${className}`.trim()}>{label}</span>;
const IconButton = ({ children, onClick }) => <button type="button" onClick={onClick} className="rounded p-1 hover:bg-slate-100">{children}</button>;

const ActiveScanBanner = ({ status, onDismiss }) => {
  if (!status || status.status === "not_found") return null;

  const chipProps = (() => {
    if (status.status === "running") return { label: "Running", className: "border-sky-200 bg-sky-50 text-sky-700" };
    if (status.status === "completed") return { label: "Completed", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
    if (status.status === "failed") return { label: "Failed", className: "border-rose-200 bg-rose-50 text-rose-700" };
    return { label: "Starting", className: "border-slate-200 bg-slate-50 text-slate-700" };
  })();

  return (
    <details className="mb-2 rounded-md border bg-white" open>
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2">
        <Typography className="font-bold">Active Scan</Typography>

          <Box className="ml-auto flex items-center gap-1">
            <Chip {...chipProps} />
            <IconButton
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDismiss?.();
              }}
            >
              <CloseIcon className="h-4 w-4" />
            </IconButton>
            <ExpandMoreIcon className="h-4 w-4 text-slate-500" />
          </Box>
      </summary>

      <div className="px-3 pb-3">
        {status ? (
          <ScanProgress status={status} />
        ) : (
          <Box className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            <Typography className="text-sm">Preparing scan status…</Typography>
          </Box>
        )}
      </div>
    </details>
  );
};

export default ActiveScanBanner;
