import React from "react";

const Box = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const Typography = ({ children, className = "" }) => (
  <p className={className}>{children}</p>
);

const InfoItem = ({ icon, label, value, isLink }) => (
  <Box className="rounded-lg border border-slate-200 bg-slate-50 p-3">
    <Box className="mb-1 text-sm">{icon}</Box>

    <Box className="space-y-1">
      <Typography className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </Typography>

      {isLink ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="block truncate text-sm text-blue-600 hover:underline"
        >
          {value || "-"}
        </a>
      ) : (
        <Typography className="truncate text-sm text-slate-800">
          {value || "-"}
        </Typography>
      )}
    </Box>
  </Box>
);

const OpenGrepScanInfoTab = ({ scanMetadata, scanStatus }) => {
  if (!scanMetadata) {
    return (
      <Box className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
        <Typography>No scan information available.</Typography>
      </Box>
    );
  }

  const statusTone = {
    COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
    FAILED: "border-rose-200 bg-rose-50 text-rose-700",
    RUNNING: "border-amber-200 bg-amber-50 text-amber-700",
  };

  const stateLabel = scanStatus?.state?.toUpperCase?.();

  return (
    <Box className="space-y-4">
      <Box className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4">
        <Typography className="text-sm font-semibold text-slate-900">
          Scan Information
        </Typography>

        {stateLabel && (
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
              statusTone[stateLabel] || "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            {scanStatus.state}
          </span>
        )}
      </Box>

      <Box className="rounded-xl border border-slate-200 bg-white p-4">
        <Box className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <InfoItem
            icon="🔗"
            label="Repository"
            value={scanMetadata.repo?.url}
            isLink
          />

          <InfoItem
            icon="🌿"
            label="Branch"
            value={scanMetadata.branch}
          />

          <InfoItem
            icon="⏱"
            label="Scan Duration"
            value={scanMetadata.duration_seconds != null ? `${scanMetadata.duration_seconds}s` : "-"}
          />

          <InfoItem
            icon="🛠"
            label="Tool"
            value={`${scanMetadata.tool || "-"} ${scanMetadata.tool_version || ""}`.trim()}
          />

          <InfoItem
            icon="🆔"
            label="Scan ID"
            value={scanMetadata.scan_id}
          />

          <InfoItem
            icon="📅"
            label="Scan Time"
            value={scanMetadata.scan_time ? new Date(scanMetadata.scan_time).toLocaleString() : "-"}
          />

          <InfoItem
            icon="📦"
            label="Triggered By"
            value={scanMetadata.triggered_by}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default OpenGrepScanInfoTab;
