import React from 'react';
import { CheckCircle, CircleX, Clock3, Loader2 } from 'lucide-react';

const SCAN_PHASES = [
  { key: 'initializing', label: 'Initialize', weight: 0 },
  { key: 'clone', label: 'Clone/Extract', weight: 10 },
  { key: 'extract', label: 'Extract', weight: 10 },
  { key: 'sonar_scan', label: 'Code Analysis', weight: 25 },
  { key: 'sonar_wait', label: 'Processing', weight: 40 },
  { key: 'sonar_fetch', label: 'Report', weight: 55 },
  { key: 'dependencies', label: 'Dependencies', weight: 70 },
  { key: 'cve_scan', label: 'Vulnerability Check', weight: 80 },
  { key: 'upload', label: 'Finalizing', weight: 90 },
  { key: 'opengrep_scan', label: 'Opengrep Scan', weight: 95 },
  { key: 'completed', label: 'Complete', weight: 100 }
];

const ScanProgress = ({ status }) => {
  if (!status || status.status === 'not_found') {
    return null;
  }

  const { status: scanStatus, phase, progress, message, error, startedAt } = status;
  
  const isRunning = scanStatus === 'running';
  const isCompleted = scanStatus === 'completed';
  const isFailed = scanStatus === 'failed';

  const getActiveStep = () => {
    const idx = SCAN_PHASES.findIndex(p => p.key === phase);
    return idx >= 0 ? idx : 0;
  };

  const getElapsedTime = () => {
    if (!startedAt) return '';
    const start = new Date(startedAt);
    const now = new Date();
    const diffMs = now - start;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s`;
    const diffMin = Math.floor(diffSec / 60);
    const sec = diffSec % 60;
    return `${diffMin}m ${sec}s`;
  };

  const activeStep = getActiveStep();
  const elapsed = getElapsedTime();
  const visibleSteps = SCAN_PHASES.filter(
    (p) => p.key !== 'initializing' && p.key !== 'extract'
  );

  return (
    <div className="scan-progress-container rounded-md border bg-card p-4">
      <div className="scan-progress-header">
        <div className="scan-progress-title-row flex items-center justify-between gap-3">
          <p className="scan-progress-title text-lg font-semibold">
            {isCompleted ? 'Scan Completed' : isFailed ? 'Scan Failed' : 'Scan in Progress'}
          </p>
          {isRunning && (
            <span className="scan-status-chip scan-status-running inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Running
            </span>
          )}
          {isCompleted && (
            <span className="scan-status-chip scan-status-completed inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
              <CheckCircle className="h-3.5 w-3.5" />
              Completed
            </span>
          )}
          {isFailed && (
            <span className="scan-status-chip scan-status-failed inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs text-red-700">
              <CircleX className="h-3.5 w-3.5" />
              Failed
            </span>
          )}
        </div>
        
        {elapsed && (
          <div className="scan-progress-meta mt-2 inline-flex items-center gap-1 text-sm text-slate-600">
            <Clock3 className="scan-progress-icon h-4 w-4" />
            <p className="scan-progress-elapsed">
              Elapsed: {elapsed}
            </p>
          </div>
        )}
      </div>

      {isFailed && error && (
        <div className="scan-progress-error mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {isRunning && (
        <>
          <div className="scan-progress-bar-section mt-3">
            <div className="scan-progress-bar h-2 w-full overflow-hidden rounded bg-slate-200">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${progress || 0}%` }}
              />
            </div>
            <p className="scan-progress-percent mt-1 text-xs text-slate-600">
              {progress || 0}%
            </p>
          </div>

          <p className="scan-progress-message mt-2 text-sm text-slate-700">
            {message || 'Processing...'}
          </p>

          <div className="scan-progress-stepper mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
            {visibleSteps.map((phaseItem, index) => {
              const done = index < activeStep;
              const current = index === activeStep;

              return (
                <div
                  key={phaseItem.key}
                  className={`rounded-md border px-2 py-1 text-xs ${
                    current
                      ? 'border-blue-300 bg-blue-50 text-blue-700'
                      : done
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  {phaseItem.label}
                </div>
              );
            })}
          </div>
        </>
      )}

      {isCompleted && (
        <div className="scan-progress-success mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Scan completed successfully. Results are now available below.
        </div>
      )}
    </div>
  );
};

export default ScanProgress;
