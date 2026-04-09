import React from "react";
import {
  Link2 as LinkIcon,
  Waypoints as AccountTreeIcon,
  Timer as TimerIcon,
  Wrench as BuildIcon,
} from "lucide-react";

const Box = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const Typography = ({ children, className = "" }) => (
  <p className={className}>{children}</p>
);

const ScanMetadata = ({ metadata }) => {
  if (!metadata) return null;

  return (
    <Box className="rounded-xl border border-slate-200 bg-white p-4">
      <Typography className="mb-3 text-sm font-semibold text-slate-900">
        Scan Info
      </Typography>

      <Box className="space-y-2">
        <Box className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <LinkIcon className="h-4 w-4 text-slate-500" />
          <a
            href={metadata.repo?.url}
            target="_blank"
            rel="noreferrer"
            className="truncate text-xs text-blue-600 hover:underline"
          >
            {metadata.repo?.url || "-"}
          </a>
        </Box>

        <Box className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <AccountTreeIcon className="h-4 w-4 text-slate-500" />
          <Typography className="text-xs text-slate-700">
            Branch: {metadata.branch || "-"}
          </Typography>
        </Box>

        <Box className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <TimerIcon className="h-4 w-4 text-slate-500" />
          <Typography className="text-xs text-slate-700">
            Duration: {metadata.duration_seconds != null ? `${metadata.duration_seconds}s` : "-"}
          </Typography>
        </Box>

        <Box className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
          <BuildIcon className="h-4 w-4 text-slate-500" />
          <Typography className="text-xs text-slate-700">
            Tool: {metadata.tool || "-"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ScanMetadata;
