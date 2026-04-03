import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Paper,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

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

  return (
    <Paper className="scan-progress-container" elevation={0}>
      <Box className="scan-progress-header">
        <Box className="scan-progress-title-row">
          <Typography variant="h6" className="scan-progress-title">
            {isCompleted ? 'Scan Completed' : isFailed ? 'Scan Failed' : 'Scan in Progress'}
          </Typography>
          {isRunning && (
            <Chip 
              icon={<CircularProgress size={16} />} 
              label="Running" 
              size="small" 
              className="scan-status-chip scan-status-running"
            />
          )}
          {isCompleted && (
            <Chip 
              icon={<CheckCircleIcon />} 
              label="Completed" 
              size="small" 
              className="scan-status-chip scan-status-completed"
            />
          )}
          {isFailed && (
            <Chip 
              icon={<ErrorIcon />} 
              label="Failed" 
              size="small" 
              className="scan-status-chip scan-status-failed"
            />
          )}
        </Box>
        
        {elapsed && (
          <Box className="scan-progress-meta">
            <ScheduleIcon fontSize="small" className="scan-progress-icon" />
            <Typography variant="body2" className="scan-progress-elapsed">
              Elapsed: {elapsed}
            </Typography>
          </Box>
        )}
      </Box>

      {isFailed && error && (
        <Alert severity="error" className="scan-progress-error">
          {error}
        </Alert>
      )}

      {isRunning && (
        <>
          <Box className="scan-progress-bar-section">
            <LinearProgress 
              variant="determinate" 
              value={progress || 0} 
              className="scan-progress-bar"
            />
            <Typography variant="body2" className="scan-progress-percent">
              {progress || 0}%
            </Typography>
          </Box>

          <Typography variant="body2" className="scan-progress-message">
            {message || 'Processing...'}
          </Typography>

          <Stepper activeStep={activeStep} className="scan-progress-stepper" alternativeLabel>
            {SCAN_PHASES.filter(p => p.key !== 'initializing' && p.key !== 'extract').map((phaseItem) => (
              <Step key={phaseItem.key}>
                <StepLabel>{phaseItem.label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </>
      )}

      {isCompleted && (
        <Alert severity="success" className="scan-progress-success">
          Scan completed successfully. Results are now available below.
        </Alert>
      )}
    </Paper>
  );
};

export default ScanProgress;
