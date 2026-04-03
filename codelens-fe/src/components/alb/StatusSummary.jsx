import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Button,
  Alert,
} from '@mui/material';
import {
  BugReport as BugReportIcon,
  Healing as HealingIcon,
  Email as EmailIcon,
  PlayArrow as AutoDeregisterIcon,
  Shield as ShieldIcon,
  Chat as SlackIcon,
} from '@mui/icons-material';
import { getTargetGroupHealthSummary, getUnhealthyTargetsCount } from '../../utils/Helpers';

const StatusSummary = ({ 
  albs, 
  targetGroups, 
  onConfigureEmail, 
  onConfigureSlack,
  onViewUnhealthyDetails,
  selectedCount,
  excludedCount,
  onSelectAllUnhealthy,
  onClearSelections,
  onAutoDeregister,
  onManualDeregister,
  autoDeregisterEnabled,
  monitoringAutoDeregister,
  lastAutoDeregisterActivity,
  slackIntegration
}) => {
  const healthSummary = getTargetGroupHealthSummary(targetGroups);
  const unhealthyCount = getUnhealthyTargetsCount(targetGroups, albs);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          ALB Status Summary
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {albs.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total ALBs
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {albs.filter(alb => alb.state === 'active').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active ALBs
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {new Set(albs.map(alb => alb.region)).size}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Regions with ALBs
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {Object.keys(targetGroups).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Target Groups
              </Typography>
            </Box>
          </Grid>
        </Grid>
        
        {/* Target Health Summary */}
        {Object.keys(targetGroups).length > 0 && (
          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>
              Target Health Summary
            </Typography>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="primary.main">
                    {healthSummary.totalTargets}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Targets
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="error.main">
                    {unhealthyCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Unhealthy
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="success.main">
                    {healthSummary.healthyTargets}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Healthy
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            {/* Auto-Deregister Monitoring Status */}
            {autoDeregisterEnabled && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ShieldIcon color="info" />
                  <Typography variant="subtitle2" color="info.dark">
                    Auto-Deregister Monitor
                  </Typography>
                  {monitoringAutoDeregister && (
                    <Chip 
                      label="Active" 
                      size="small" 
                      color="success" 
                      variant="outlined"
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {monitoringAutoDeregister 
                    ? "Monitoring for auto-deregister activity... UI will refresh automatically when targets are deregistered."
                    : "Monitor not active - refresh page to see latest auto-deregister results."
                  }
                </Typography>
                {lastAutoDeregisterActivity?.lastRunAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Last activity: {new Date(lastAutoDeregisterActivity.lastRunAt).toLocaleString()}
                    {lastAutoDeregisterActivity.totalDeregistered > 0 && 
                      ` • ${lastAutoDeregisterActivity.totalDeregistered} targets deregistered`
                    }
                  </Typography>
                )}
              </Box>
            )}

            {/* Unhealthy Instances Quick Actions */}
            {!autoDeregisterEnabled && unhealthyCount > 0 && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <BugReportIcon color="error" />
                  <Typography variant="subtitle2" color="error.dark">
                    ⚠️ {unhealthyCount} Unhealthy Instance{unhealthyCount > 1 ? 's' : ''} Detected
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Some instances are experiencing health issues. Click below to view detailed information and take action.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<HealingIcon />}
                    onClick={onViewUnhealthyDetails}
                    size="small"
                  >
                    View Unhealthy Details
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<EmailIcon />}
                    onClick={onConfigureEmail}
                    size="small"
                  >
                    Configure Email Alerts
                  </Button>
                </Box>
              </Box>
            )}

            {/* Email Configuration Button (always visible) */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="text"
                color="primary"
                startIcon={<EmailIcon />}
                onClick={onConfigureEmail}
                size="small"
                sx={{ textTransform: 'none' }}
              >
                <EmailIcon sx={{ mr: 1 }} />
                Email Settings
              </Button>
              
              <Button
                variant="text"
                color="primary"
                startIcon={<SlackIcon />}
                onClick={onConfigureSlack}
                size="small"
                sx={{ textTransform: 'none' }}
              >
                Slack Settings
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusSummary;
