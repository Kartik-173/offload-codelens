import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Fab,
  Snackbar,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Email as EmailIcon,
  Public,
  WarningAmber as WarningAmberIcon,
  Chat as SlackIcon,
} from '@mui/icons-material';
import { 
  AWS_REGIONS, 
  getUserId, 
  getSelectedRegionsStorageKey, 
  getAutoRefreshStorageKey 
} from '../utils/Helpers';
import { useAwsCredentials } from '../hooks/alb/useAwsCredentials';
import { useAlbData } from '../hooks/alb/useAlbData';
import { useHealthMonitor } from '../hooks/alb/useHealthMonitor';
import { useNotifications } from '../hooks/alb/useNotifications';
import { useTargetSelections } from '../hooks/useTargetSelections';
import useAutoDeregisterMonitor from '../hooks/alb/useAutoDeregisterMonitor';
import StatusSummary from '../components/alb/StatusSummary';
import AccountInfo from '../components/alb/AccountInfo';
import RegionFilter from '../components/alb/RegionFilter';
import AlbTable from '../components/alb/AlbTable';
import EmailConfigDialog from '../components/alb/EmailConfigDialog';
import SlackConfigDialog from '../components/alb/SlackOAuthConfigDialog.jsx';
import AlbAutoActionsApiService from '../services/AlbAutoActionsApiService';
import AwsAlbApiService from '../services/AwsAlbApiService';

const AwsAlbManager = () => {
  // Use AWS regions from helpers
  const awsRegions = AWS_REGIONS;

  // Local state
  const [expandedAlbRows, setExpandedAlbRows] = useState({});
  const [filterRegion, setFilterRegion] = useState('all');
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [autoDeregisterConfirmOpen, setAutoDeregisterConfirmOpen] = useState(false);
  const [manualDeregisterConfirm, setManualDeregisterConfirm] = useState({ open: false, payload: null });
  const [albDataDialog, setAlbDataDialog] = useState({ open: false, loading: false });

  // Custom hooks
  const {
    selectedTargets,
    excludedTargets,
    loading: selectionsLoading,
    error: selectionsError,
    toggleTargetSelection,
    isTargetSelected,
    isTargetExcluded,
    excludeTargetFromAutoDeregister,
    removeTargetExclusion,
    selectAllTargetsInGroup,
    deselectAllTargetsInGroup,
    selectAllUnhealthyTargets,
    clearAllSelections,
    performAutoDeregister,
    selectedCount,
    excludedCount,
  } = useTargetSelections();

  const {
    storedCredentials,
    accountIds,
    accountIdToName,
    selectedAccountId,
    accountSettingsLoading,
    autoDeregisterEnabled,
    error: credentialsError,
    fetchStoredCredentials,
    handleAccountChange: handleCredentialAccountChange,
    saveAccountSettings,
    setAutoDeregisterEnabled: setAutoDeregisterFromHook,
    setError: setCredentialsError,
  } = useAwsCredentials(selectedRegions);

  const {
    albs,
    targetGroups,
    loading,
    error: albError,
    success,
    lastFetchTime,
    memoryStats,
    healthMonitorStatus,
    fetchAlbs,
    fetchAlbsFromAWS,
    handleForceFreshScan,
    setError: setAlbError,
    setSuccess,
    setAlbs,
    setTargetGroups,
    setLastFetchTime,
  } = useAlbData(storedCredentials, selectedRegions, autoRefreshEnabled);

  // Monitor auto-deregister activity and refresh UI when detected
  const {
    isMonitoring: monitoringAutoDeregister,
    lastActivity: lastAutoDeregisterActivity,
  } = useAutoDeregisterMonitor(selectedAccountId, async (activity) => {
    console.log('🔄 Auto-deregister activity detected, refreshing UI data...');
    
    // Show notification about the activity
    if (activity.totalDeregistered > 0) {
      setSuccess(`Auto-deregister completed: ${activity.totalDeregistered} targets deregistered`);
    }
    
    // Force refresh ALB data to get latest state
    await fetchAlbsFromAWS();
  });

  const {
    emailConfigDialog,
    emailConfig,
    newEmail,
    slackConfigDialog,
    slackIntegration,
    slackLoading,
    handleOpenEmailConfig,
    handleCloseEmailConfig,
    handleUpdateEmailConfig,
    handleRemoveEmail,
    handleAddEmail,
    setNewEmail,
    setEmailConfig,
    handleOpenSlackConfig,
    handleCloseSlackConfig,
    handleSlackConfigSuccess,
    handleLoadSlackIntegration,
    handleConnectSlack,
    handleDisconnectSlack,
    handleTestSlackNotification,
    handleTestSESConnectivity,
  } = useNotifications(setAlbError, setSuccess, selectedAccountId);

  const {
    unhealthyDetailsDialog,
    handleShowUnhealthyDetails,
    handleShowAllUnhealthyDetails,
    handleCloseUnhealthyDetails,
    setUnhealthyDetailsDialog,
  } = useHealthMonitor(albs, targetGroups, storedCredentials, selectedRegions, autoDeregisterEnabled, emailConfig, setAlbError, setSuccess, setToast, selectedAccountId);

  // Load Slack integration status on component mount
  useEffect(() => {
    if (selectedAccountId) {
      handleLoadSlackIntegration();
    }
  }, [selectedAccountId]);

  // Combined error state
  const error = credentialsError || albError;
  const setError = (message) => {
    setCredentialsError(message);
    setAlbError(message);
  };

  const handleDeregisterSingleTarget = async ({ targetGroupArn, targetId, port, isProtected }) => {
    if (isProtected) {
      setToast({
        open: true,
        message: 'This target is protected (selected/excluded) and cannot be deregistered.',
        severity: 'warning',
      });
      return;
    }

    if (!storedCredentials || !selectedAccountId) {
      setToast({ open: true, message: 'Please select an account first', severity: 'error' });
      return;
    }

    try {
      setToast({ open: true, message: 'Deregistering target...', severity: 'info' });
      await AwsAlbApiService.deregisterTarget({
        accessKeyId: storedCredentials.accessKeyId,
        secretAccessKey: storedCredentials.secretAccessKey,
        sessionToken: storedCredentials.sessionToken,
        region: selectedRegions[0] || 'us-east-1',
        targetGroupArn,
        targetId,
        targetPort: port,
        accountId: selectedAccountId,
      });

      setToast({ open: true, message: 'Target deregistered successfully', severity: 'success' });
      fetchAlbs();
    } catch (error) {
      setToast({ open: true, message: `Failed to deregister target: ${error.message}`, severity: 'error' });
    }
  };

  const handleDeregisterSingleTargetConfirmRequest = ({ targetGroupArn, targetId, port, isProtected }) => {
    if (isProtected) {
      setToast({
        open: true,
        message: 'This target is protected (selected/excluded) and cannot be deregistered.',
        severity: 'warning',
      });
      return;
    }

    if (!storedCredentials || !selectedAccountId) {
      setToast({ open: true, message: 'Please select an account first', severity: 'error' });
      return;
    }

    setManualDeregisterConfirm({
      open: true,
      payload: { targetGroupArn, targetId, port, isProtected: false },
    });
  };

  // Auto-deregister handler
  const handleAutoDeregister = async () => {
    if (!storedCredentials || !selectedAccountId) {
      setToast({ open: true, message: 'Please select an account first', severity: 'error' });
      return;
    }

    // Check if auto deregister is enabled
    if (!autoDeregisterEnabled) {
      setToast({ open: true, message: 'Auto deregister is not enabled', severity: 'error' });
      return;
    }

    try {
      setToast({ open: true, message: 'Starting auto-deregistration...', severity: 'info' });
      
      const credentials = {
        accessKeyId: storedCredentials.accessKeyId,
        secretAccessKey: storedCredentials.secretAccessKey,
        sessionToken: storedCredentials.sessionToken,
        region: selectedRegions[0] || 'us-east-1',
        accountId: selectedAccountId,
        userId: getUserId()
      };

      // Use new backend API instead of direct frontend call
      const result = await AlbAutoActionsApiService.performAutoDeregister(selectedAccountId, credentials, selectedRegions);
      
      const { deregistered, excluded, selected, protected: protectedCount } = result.data.summary;
      
      setToast({ 
        open: true, 
        message: `Auto-deregistration completed: ${deregistered} deregistered, ${excluded + selected} protected (${protectedCount} total)`, 
        severity: 'success' 
      });
      
      // Refresh ALB data after auto-deregister
      fetchAlbs();
      
    } catch (error) {
      console.error('Auto-deregister failed:', error);
      setToast({ 
        open: true, 
        message: `Auto-deregistration failed: ${error.message}`, 
        severity: 'error' 
      });
    }
  };

  const handleManualDeregister = async () => {
    if (!storedCredentials || !selectedAccountId) {
      setToast({ open: true, message: 'Please select an account first', severity: 'error' });
      return;
    }

    try {
      const protectedCount = (selectedCount || 0) + (excludedCount || 0);
      if (protectedCount > 0) {
        setToast({
          open: true,
          message: `${protectedCount} target(s) are protected (selected/excluded) and will NOT be deregistered. Unselect/unexclude to allow deregister.`,
          severity: 'info',
        });
      } else {
        setToast({ open: true, message: 'Starting manual deregistration...', severity: 'info' });
      }

      const credentials = {
        accessKeyId: storedCredentials.accessKeyId,
        secretAccessKey: storedCredentials.secretAccessKey,
        sessionToken: storedCredentials.sessionToken,
        region: selectedRegions[0] || 'us-east-1',
        accountId: selectedAccountId,
        userId: getUserId(),
      };

      const result = await AlbAutoActionsApiService.performAutoDeregister(
        selectedAccountId,
        credentials,
        selectedRegions
      );

      const summary = result?.data?.summary;
      const deregistered = summary?.deregistered ?? 0;
      const excluded = summary?.excluded ?? 0;
      const selected = summary?.selected ?? 0;
      const protectedTotal = summary?.protected ?? (excluded + selected);

      if (deregistered === 0 && (excluded + selected) > 0) {
        setToast({
          open: true,
          message: `No targets were deregistered. ${excluded + selected} target(s) were protected (${protectedTotal} total).`,
          severity: 'warning',
        });
      } else {
        setToast({
          open: true,
          message: `Manual deregistration completed: ${deregistered} deregistered, ${excluded + selected} protected (${protectedTotal} total)`,
          severity: 'success',
        });
      }

      fetchAlbs();
    } catch (error) {
      console.error('Manual deregister failed:', error);
      setToast({
        open: true,
        message: `Manual deregister failed: ${error.message}`,
        severity: 'error',
      });
    }
  };

  // Event Handlers
  const handleAccountChange = async (newAccountId) => {
    await handleCredentialAccountChange(newAccountId);
    // Clear existing data when account changes
    setAlbs([]);
    setTargetGroups({});
    setSuccess('');
    setError('');
    setLastFetchTime(null);
  };

  const handleRegionsChange = (newRegions) => {
    setSelectedRegions(newRegions);
  };

  const handleClearRegions = () => {
    setSelectedRegions([]);
  };

  const handleSelectAllRegions = () => {
    setSelectedRegions(awsRegions.map(region => region.value));
  };

  const handleToggleAlbRow = (albKey) => {
    setExpandedAlbRows((prev) => ({
      ...prev,
      [albKey]: !prev[albKey],
    }));
  };

  const handleFilterChange = (newFilter) => {
    setFilterRegion(newFilter);
  };

  const handleAutoDeregisterToggle = async (e) => {
    const next = e.target.checked;
    console.log('🔄 Auto Deregister toggle changed:', { next, selectedAccountId });
    
    if (next) {
      // When turning ON, make API call to save settings and start service
      console.log('🔄 Turning ON auto deregister, calling saveAccountSettings...');
      setAutoDeregisterFromHook(true);
      try {
        await saveAccountSettings(selectedAccountId, {
          autoDeregisterEnabled: true
        });
        console.log('✅ Auto deregister settings saved successfully');
        
        // Start auto deregister service using new API
        try {
          await AlbAutoActionsApiService.startAutoDeregister(selectedAccountId, {
            regions: selectedRegions,
            interval: 5 * 60 * 1000 // 5 minutes
          });
          console.log('✅ Auto deregister service started via API');
        } catch (refreshError) {
          console.error('❌ Failed to start auto deregister service:', refreshError);
          // Don't revert the toggle, just log the error
        }
      } catch (error) {
        console.error('❌ Failed to save settings:', error);
        setAutoDeregisterFromHook(false); // Revert on error
      }
    } else {
      // When turning OFF, save settings and stop service
      console.log('🔄 Turning OFF auto deregister, saving settings...');
      setAutoDeregisterFromHook(false);
      
      try {
        // Save account settings to persist the OFF state
        await saveAccountSettings(selectedAccountId, {
          autoDeregisterEnabled: false
        });
        console.log('✅ Auto deregister settings saved (disabled)');
      } catch (error) {
        console.error('❌ Failed to save settings when turning off:', error);
        // Don't revert the toggle, just log the error
      }
      
      // Stop auto deregister service using new API
      try {
        await AlbAutoActionsApiService.stopAutoDeregister(selectedAccountId);
        console.log('✅ Auto deregister service stopped via API');
      } catch (refreshError) {
        console.error('❌ Failed to stop auto deregister service:', refreshError);
        // Don't revert the toggle, just log the error
      }
    }
  };

  const handleOpenAlbDataDialog = () => {
    setAlbDataDialog(prev => ({ ...prev, open: true }));
  };

  const handleCloseAlbDataDialog = () => {
    setAlbDataDialog(prev => ({ ...prev, open: false }));
  };

  // Get unique regions from fetched ALBs for filter dropdown
  const availableRegions = ['all', ...new Set(albs.map(alb => alb.region))];
  
  // Filter ALBs based on selected filter region
  const filteredAlbs = filterRegion === 'all' ? albs : albs.filter(alb => alb.region === filterRegion);

  // Restore selected regions + auto-refresh preference on load
  useEffect(() => {
    try {
      const storedRegionsRaw = localStorage.getItem(getSelectedRegionsStorageKey());
      if (storedRegionsRaw) {
        const parsed = JSON.parse(storedRegionsRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Keep only valid regions
          const valid = parsed.filter((r) => awsRegions.some((opt) => opt.value === r));
          if (valid.length > 0) {
            setSelectedRegions(valid);
          }
        }
      }

      const storedAutoRefresh = localStorage.getItem(getAutoRefreshStorageKey());
      if (storedAutoRefresh === 'true') {
        setAutoRefreshEnabled(true);
      }
    } catch (e) {
      console.error('Failed to restore region selection:', e);
    }
  }, []);

  // Persist selected regions per user
  useEffect(() => {
    try {
      localStorage.setItem(getSelectedRegionsStorageKey(), JSON.stringify(selectedRegions));
    } catch (e) {
      console.error('Failed to persist selected regions:', e);
    }
  }, [selectedRegions]);

  // Persist auto-refresh preference per user
  useEffect(() => {
    try {
      localStorage.setItem(getAutoRefreshStorageKey(), autoRefreshEnabled ? 'true' : 'false');
    } catch (e) {
      console.error('Failed to persist auto-refresh preference:', e);
    }
  }, [autoRefreshEnabled]);

  // Handle auto-refresh service based on auto deregister settings
  useEffect(() => {
    if (accountSettingsLoading) {
      console.log('⏳ Account settings still loading, skipping service management');
      return;
    }

    const manageAutoActionServices = async () => {
      try {
        console.log('🔄 Managing auto action services:', {
          autoDeregisterEnabled,
          selectedAccountId,
        });

        if (!selectedAccountId) return;

        if (autoDeregisterEnabled) {
          try {
            await AlbAutoActionsApiService.startAutoDeregister(selectedAccountId, {
              regions: selectedRegions,
              interval: 5 * 60 * 1000,
            });
            console.log('✅ Auto deregister service started');
          } catch (error) {
            console.error('❌ Failed to start auto deregister service:', error);
          }
        } else {
          try {
            await AlbAutoActionsApiService.stopAutoDeregister(selectedAccountId);
            console.log('✅ Auto deregister service stopped');
          } catch (error) {
            console.error('❌ Failed to stop auto deregister service:', error);
          }
        }
      } catch (error) {
        console.error('❌ Error managing auto action services:', error);
      }
    };

    if (storedCredentials && selectedRegions.length > 0 && selectedAccountId) {
      const timeoutId = setTimeout(() => {
        manageAutoActionServices();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [autoDeregisterEnabled, storedCredentials, selectedRegions, selectedAccountId, accountSettingsLoading]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Load Balancer Health Preview
      </Typography>
      
      {/* Loading State */}
      {loading && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={40} sx={{ mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {selectedRegions.length > 0 ? `Fetching Load Balancers...` : 'Loading...'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedRegions.length > 0 ? `Checking ${selectedRegions.length} region(s) for Load Balancers` : 'Please select regions'}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Credential Status */}
      {!storedCredentials && (
        <Card sx={{ mb: 3, border: '2px dashed #ff9800', backgroundColor: '#fff8e1' }}>
          <CardContent sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h6" color="#f57c00" gutterBottom>
              🔐 AWS Credentials Required
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Automatically retrieving your cloud credentials...
            </Typography>
            <Button 
              variant="outlined" 
              color="warning" 
              size="small"
              onClick={fetchStoredCredentials}
              sx={{ mr: 1 }}
            >
              Refresh Credentials
            </Button>
            <Button 
              variant="contained" 
              color="warning" 
              size="small"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Status Summary */}
      {storedCredentials && (
        <StatusSummary
          albs={albs}
          targetGroups={targetGroups}
          onConfigureEmail={handleOpenEmailConfig}
          onConfigureSlack={handleOpenSlackConfig}
          onViewUnhealthyDetails={handleShowAllUnhealthyDetails}
          selectedCount={selectedCount}
          excludedCount={excludedCount}
          onSelectAllUnhealthy={selectAllUnhealthyTargets}
          onClearSelections={clearAllSelections}
          onAutoDeregister={handleAutoDeregister}
          onManualDeregister={handleManualDeregister}
          autoDeregisterEnabled={autoDeregisterEnabled}
          monitoringAutoDeregister={monitoringAutoDeregister}
          lastAutoDeregisterActivity={lastAutoDeregisterActivity}
          slackIntegration={slackIntegration}
        />
      )}

      {/* Account Info */}
      {storedCredentials && (
        <AccountInfo
          storedCredentials={storedCredentials}
          accountIds={accountIds}
          accountIdToName={accountIdToName}
          selectedAccountId={selectedAccountId}
          selectedRegions={selectedRegions}
          loading={loading}
          lastFetchTime={lastFetchTime}
          autoDeregisterEnabled={autoDeregisterEnabled}
          onAccountChange={handleAccountChange}
          onRegionsChange={handleRegionsChange}
          onClearRegions={handleClearRegions}
          onSelectAllRegions={handleSelectAllRegions}
          onFetchAlbs={fetchAlbs}
          onOpenEmailConfig={handleOpenEmailConfig}
          onOpenSlackConfig={handleOpenSlackConfig}
          onAutoDeregisterToggle={handleAutoDeregisterToggle}
          onSaveAccountSettings={saveAccountSettings}
        />
      )}

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Load Balancers List */}
      {albs.length > 0 ? (
        <Box>
          <RegionFilter
            albs={albs}
            availableRegions={availableRegions}
            filterRegion={filterRegion}
            onFilterChange={handleFilterChange}
            onFetchAlbs={fetchAlbs}
            loading={loading}
            lastFetchTime={lastFetchTime}
          />
          
          <AlbTable
            albs={filteredAlbs}
            expandedAlbRows={expandedAlbRows}
            onToggleAlbRow={handleToggleAlbRow}
            onShowUnhealthyDetails={handleShowUnhealthyDetails}
            selectedTargets={selectedTargets}
            onToggleTargetSelection={toggleTargetSelection}
            excludedTargets={excludedTargets}
            onRemoveExclusion={removeTargetExclusion}
            onSelectAllInGroup={selectAllTargetsInGroup}
            onDeselectAllInGroup={deselectAllTargetsInGroup}
            isTargetSelected={isTargetSelected}
            isTargetExcluded={isTargetExcluded}
            autoDeregisterEnabled={autoDeregisterEnabled}
            onDeregisterSingleTarget={handleDeregisterSingleTargetConfirmRequest}
          />
        </Box>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Load Balancers Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {selectedRegions.length > 0
                ? `No Load Balancers found. Try selecting different regions or check your AWS permissions.`
                : 'Please select regions and click "Fetch" to load Load Balancers.'}
            </Typography>
            {selectedRegions.length === 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                  👆 Select regions from the dropdown above and click "Fetch" to get started
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Unhealthy Target Details Dialog */}
      <Dialog
        open={Boolean(unhealthyDetailsDialog.open)}
        onClose={handleCloseUnhealthyDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Unhealthy Target Details
          {unhealthyDetailsDialog.targetGroupName && (
            <Typography variant="subtitle2" color="text.secondary">
              Target Group: {unhealthyDetailsDialog.targetGroupName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {unhealthyDetailsDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Loading unhealthy target details...</Typography>
            </Box>
          ) : unhealthyDetailsDialog.data ? (
            <Box>
              {/* Summary */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Summary
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Chip label={`Healthy: ${unhealthyDetailsDialog.data.summary?.healthyCount || 0}`} color="success" />
                  <Chip label={`Unhealthy: ${unhealthyDetailsDialog.data.summary?.unhealthyCount || 0}`} color="error" />
                  <Chip label={`Unknown: ${unhealthyDetailsDialog.data.summary?.unknownCount || 0}`} color="default" />
                </Box>
              </Box>

              {/* Unhealthy Targets */}
              {unhealthyDetailsDialog.data.unhealthyTargets && unhealthyDetailsDialog.data.unhealthyTargets.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Unhealthy Targets
                  </Typography>
                  {unhealthyDetailsDialog.data.unhealthyTargets.map((target, index) => (
                    <Card key={index} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderLeft: '4px solid', borderLeftColor: 'error.main' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Target: {target.id}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip
                              title={(() => {
                                const tid = target.id;
                                const p = target.port;
                                const isProtected = isTargetSelected(tid, p) || isTargetExcluded(tid, p);
                                return isProtected
                                  ? 'Protected targets cannot be deregistered'
                                  : 'Deregister this target';
                              })()}
                            >
                              <span>
                                <Button
                                  variant="contained"
                                  color="warning"
                                  size="small"
                                  disabled={(() => {
                                    const tid = target.id;
                                    const p = target.port;
                                    return isTargetSelected(tid, p) || isTargetExcluded(tid, p);
                                  })()}
                                  onClick={() => {
                                    const tid = target.id;
                                    const p = target.port;
                                    const isProtected = isTargetSelected(tid, p) || isTargetExcluded(tid, p);
                                    const tgArn = target.targetGroupArn || unhealthyDetailsDialog.targetGroupArn;
                                    handleDeregisterSingleTargetConfirmRequest({
                                      targetGroupArn: tgArn,
                                      targetId: tid,
                                      port: p,
                                      isProtected,
                                    });
                                  }}
                                >
                                  Deregister
                                </Button>
                              </span>
                            </Tooltip>
                          </Box>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Port: {target.port}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Health: {target.health}
                        </Typography>
                        {target.reason && (
                          <Typography variant="body2" color="text.secondary">
                            Reason: {target.reason}
                          </Typography>
                        )}
                        {target.possibleCauses && target.possibleCauses.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Possible Causes:
                            </Typography>
                            <ul>
                              {target.possibleCauses.map((cause, i) => (
                                <li key={i}>{cause}</li>
                              ))}
                            </ul>
                          </Box>
                        )}
                        {target.recommendedActions && target.recommendedActions.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Recommended Actions:
                            </Typography>
                            <ul>
                              {target.recommendedActions.map((action, i) => (
                                <li key={i}>{action}</li>
                              ))}
                            </ul>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}

              {/* All Targets */}
              {unhealthyDetailsDialog.data.allTargets && unhealthyDetailsDialog.data.allTargets.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    All Targets
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Target ID</TableCell>
                        <TableCell>Port</TableCell>
                        <TableCell>Health</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {unhealthyDetailsDialog.data.allTargets.map((target, index) => (
                        <TableRow key={index}>
                          <TableCell>{target.id}</TableCell>
                          <TableCell>{target.port}</TableCell>
                          <TableCell>
                            <Chip 
                              label={target.health} 
                              color={target.health === 'healthy' ? 'success' : target.health === 'unhealthy' ? 'error' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{target.reason || '-'}</TableCell>
                          <TableCell>{target.description || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No data available
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUnhealthyDetails}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={manualDeregisterConfirm.open}
        onClose={() => setManualDeregisterConfirm({ open: false, payload: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="warning" />
          Confirm Deregister
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will deregister the instance from the target group.
          </Typography>
          {manualDeregisterConfirm.payload?.targetId && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              Instance: <strong>{manualDeregisterConfirm.payload.targetId}</strong>
              {manualDeregisterConfirm.payload?.port !== undefined && manualDeregisterConfirm.payload?.port !== null
                ? `:${manualDeregisterConfirm.payload.port}`
                : ''}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setManualDeregisterConfirm({ open: false, payload: null })}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={async () => {
              const payload = manualDeregisterConfirm.payload;
              setManualDeregisterConfirm({ open: false, payload: null });
              if (payload) {
                await handleDeregisterSingleTarget(payload);
              }
            }}
          >
            Deregister
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Configuration Dialog */}
      <EmailConfigDialog
        open={emailConfigDialog.open}
        loading={emailConfigDialog.loading}
        emailConfig={emailConfig}
        newEmail={newEmail}
        onClose={handleCloseEmailConfig}
        onSave={handleUpdateEmailConfig}
        onAddEmail={handleAddEmail}
        onRemoveEmail={handleRemoveEmail}
        onNewEmailChange={(e) => setNewEmail(e.target.value)}
        onConfigChange={(field, value) => setEmailConfig(prev => ({ ...prev, [field]: value }))}
      />

      {/* Slack Configuration Dialog */}
      <SlackConfigDialog
        open={slackConfigDialog.open}
        onClose={handleCloseSlackConfig}
        onSuccess={handleSlackConfigSuccess}
      />

      {/* Floating Action Buttons */}
      {storedCredentials && (
        <>
          <Fab
            color="primary"
            aria-label="configure-email"
            onClick={handleOpenEmailConfig}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              '&:hover': {
                background: 'linear-gradient(45deg, #764ba2, #667eea)',
              },
            }}
          >
            <EmailIcon />
          </Fab>
          
          <Fab
            color="secondary"
            aria-label="realtime-alb-monitoring"
            onClick={handleOpenAlbDataDialog}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 90,
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              '&:hover': {
                background: 'linear-gradient(45deg, #42a5f5, #1976d2)',
              },
            }}
          >
            <Public />
          </Fab>
        </>
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast(prev => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AwsAlbManager;
