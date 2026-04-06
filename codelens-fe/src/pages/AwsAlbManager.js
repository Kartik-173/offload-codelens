import React, { useState, useEffect } from 'react';
import {
  Mail,
  Globe,
  AlertTriangle,
  MessageSquare,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trash2,
  Save,
  Play,
  AlertCircle,
  CheckCircle,
  XCircle,
  Server,
  Activity,
  Bell,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

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
    <div className="p-6">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">
        Load Balancer Health Preview
      </h1>
      
      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow mb-6 p-6 text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-500" />
          <h2 className="text-xl font-semibold text-slate-600 mb-2">
            {selectedRegions.length > 0 ? `Fetching Load Balancers...` : 'Loading...'}
          </h2>
          <p className="text-slate-500">
            {selectedRegions.length > 0 ? `Checking ${selectedRegions.length} region(s) for Load Balancers` : 'Please select regions'}
          </p>
        </div>
      )}

      {/* Credential Status */}
      {!storedCredentials && (
        <div className="bg-amber-50 border-2 border-dashed border-amber-400 rounded-lg mb-6 p-6 text-center">
          <h2 className="text-xl font-semibold text-amber-700 mb-2">
            🔐 AWS Credentials Required
          </h2>
          <p className="text-slate-600 mb-4">
            Automatically retrieving your cloud credentials...
          </p>
          <div className="flex justify-center gap-2">
            <button 
              className="px-4 py-2 border border-amber-500 text-amber-700 rounded-md hover:bg-amber-100 text-sm"
              onClick={fetchStoredCredentials}
            >
              Refresh Credentials
            </button>
            <button 
              className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 text-sm"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4 flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Load Balancers List */}
      {albs.length > 0 ? (
        <div>
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
        </div>
      ) : (
        <Card className="mb-3">
          <div className="text-center py-8">
            <h6 className="text-lg font-semibold text-slate-600 mb-2">
              No Load Balancers Found
            </h6>
            <p className="text-sm text-slate-500 mb-4">
              {selectedRegions.length > 0
                ? `No Load Balancers found. Try selecting different regions or check your AWS permissions.`
                : 'Please select regions and click "Fetch" to load Load Balancers.'}
            </p>
            {selectedRegions.length === 0 && (
              <div className="mt-4">
                <p className="text-sm text-blue-600 font-bold">
                  👆 Select regions from the dropdown above and click "Fetch" to get started
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Unhealthy Target Details Dialog */}
      <Dialog
        open={Boolean(unhealthyDetailsDialog.open)}
        onOpenChange={(open) => !open && handleCloseUnhealthyDetails()}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Unhealthy Target Details
              {unhealthyDetailsDialog.targetGroupName && (
                <p className="text-sm text-slate-500 mt-1">
                  Target Group: {unhealthyDetailsDialog.targetGroupName}
                </p>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {unhealthyDetailsDialog.loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
              <span>Loading unhealthy target details...</span>
            </div>
          ) : unhealthyDetailsDialog.data ? (
            <div>
              {/* Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Summary</h3>
                <div className="flex gap-2 mb-4">
                  <Badge className="bg-green-100 text-green-800">Healthy: {unhealthyDetailsDialog.data.summary?.healthyCount || 0}</Badge>
                  <Badge className="bg-red-100 text-red-800">Unhealthy: {unhealthyDetailsDialog.data.summary?.unhealthyCount || 0}</Badge>
                  <Badge className="bg-gray-100 text-gray-800">Unknown: {unhealthyDetailsDialog.data.summary?.unknownCount || 0}</Badge>
                </div>
              </div>

              {/* Unhealthy Targets */}
              {unhealthyDetailsDialog.data.unhealthyTargets && unhealthyDetailsDialog.data.unhealthyTargets.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Unhealthy Targets</h3>
                  {unhealthyDetailsDialog.data.unhealthyTargets.map((target, index) => (
                    <Card key={index} className="mb-3 border border-slate-200 border-l-4 border-l-red-500">
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <h4 className="font-medium">Target: {target.id}</h4>
                          <div className="flex gap-2">
                            <Button
                              variant="warning"
                              size="sm"
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
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">Port: {target.port}</p>
                        <p className="text-sm text-slate-600 mb-1">Health: {target.health}</p>
                        {target.reason && (
                          <p className="text-sm text-slate-600 mb-1">Reason: {target.reason}</p>
                        )}
                        {target.possibleCauses && target.possibleCauses.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-2">Possible Causes:</p>
                            <ul className="text-sm text-slate-600 list-disc pl-4">
                              {target.possibleCauses.map((cause, i) => (
                                <li key={i}>{cause}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {target.recommendedActions && target.recommendedActions.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-2">Recommended Actions:</p>
                            <ul className="text-sm text-slate-600 list-disc pl-4">
                              {target.recommendedActions.map((action, i) => (
                                <li key={i}>{action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* All Targets */}
              {unhealthyDetailsDialog.data.allTargets && unhealthyDetailsDialog.data.allTargets.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">All Targets</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Target ID</TableHead>
                        <TableHead>Port</TableHead>
                        <TableHead>Health</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unhealthyDetailsDialog.data.allTargets.map((target, index) => (
                        <TableRow key={index}>
                          <TableCell>{target.id}</TableCell>
                          <TableCell>{target.port}</TableCell>
                          <TableCell>
                            <Badge className={
                              target.health === 'healthy' ? 'bg-green-100 text-green-800' : 
                              target.health === 'unhealthy' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'
                            }>
                              {target.health}
                            </Badge>
                          </TableCell>
                          <TableCell>{target.reason || '-'}</TableCell>
                          <TableCell>{target.description || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-600">No data available</p>
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={handleCloseUnhealthyDetails}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
        open={manualDeregisterConfirm.open}
        onOpenChange={(open) => !open && setManualDeregisterConfirm({ open: false, payload: null })}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Deregister
            </DialogTitle>
          </DialogHeader>
          
          <p className="text-sm text-slate-600 mb-4">
            This will deregister the instance from the target group.
          </p>
          {manualDeregisterConfirm.payload?.targetId && (
            <p className="text-sm mb-4">
              Instance: <strong>{manualDeregisterConfirm.payload.targetId}</strong>
              {manualDeregisterConfirm.payload?.port !== undefined && manualDeregisterConfirm.payload?.port !== null
                ? `:${manualDeregisterConfirm.payload.port}`
                : ''}
            </p>
          )}
        </DialogContent>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setManualDeregisterConfirm({ open: false, payload: null })}
          >
            Cancel
          </Button>
          <Button
            variant="warning"
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
        </DialogFooter>
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
          <button
            onClick={handleOpenEmailConfig}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
            aria-label="configure-email"
          >
            <Mail className="h-6 w-6" />
          </button>
          
          <button
            onClick={handleOpenAlbDataDialog}
            className="fixed bottom-6 right-24 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
            aria-label="realtime-alb-monitoring"
          >
            <Globe className="h-6 w-6" />
          </button>
        </>
      )}

      {toast.open && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm px-4 py-3 rounded-md shadow-lg ${
          toast.severity === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 
          toast.severity === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-700' : 
          'bg-green-50 border border-green-200 text-green-700'
        }`}>
          <div className="flex items-center justify-between gap-4">
            <span>{toast.message}</span>
            <button 
              onClick={() => setToast(prev => ({ ...prev, open: false }))}
              className="text-current opacity-50 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AwsAlbManager;
