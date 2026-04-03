import { useState, useEffect, useRef } from 'react';
import AwsAlbApiService from '../../services/AwsAlbApiService';
import HealthMonitorApiService from '../../services/HealthMonitorApiService';
import { getAllUnhealthyTargets } from '../../utils/Helpers';

export const useHealthMonitor = (
  albs, 
  targetGroups, 
  credentials, 
  selectedRegions, 
  autoDeregisterEnabled, 
  emailConfig,
  setError,
  setSuccess,
  setToast,
  selectedAccountId
) => {
  const [deregisterDialog, setDeregisterDialog] = useState({
    open: false,
    targetGroupArn: '',
    targetId: '',
    targetPort: '',
    region: '',
    targetName: '',
    targets: [],
    healthyCount: 0,
    unhealthyCount: 0,
  });
  const [deregisterLoading, setDeregisterLoading] = useState(false);
  const [autoDeregisterConfirmOpen, setAutoDeregisterConfirmOpen] = useState(false);
  const [unhealthyDetailsDialog, setUnhealthyDetailsDialog] = useState({
    open: false,
    targetGroupArn: '',
    targetGroupName: '',
    loading: false,
    data: null,
  });

  // Refs for managing auto-deregister state
  const autoDeregisterInFlightRef = useRef(false);
  const autoDeregisterAttemptedRef = useRef(new Set());

  // Handle opening deregister dialog
  const handleOpenDeregisterDialog = (dialogData) => {
    console.log('🔍 DEBUG: handleOpenDeregisterDialog - received data:', dialogData);
    setDeregisterDialog(prev => ({
      ...prev,
      ...dialogData
    }));
  };

  // Handle target deregistration
  const handleDeregisterTarget = async () => {
    const { targetGroupArn, targetId, targetPort, region, targets, healthyCount, unhealthyCount } = deregisterDialog;
    
    console.log('🔍 DEBUG: useHealthMonitor - full deregisterDialog:', deregisterDialog);
    console.log('🔍 DEBUG: useHealthMonitor - extracted healthyCount:', healthyCount, 'unhealthyCount:', unhealthyCount);
    
    try {
      setDeregisterLoading(true);
      await AwsAlbApiService.deregisterTarget({
        ...credentials,
        region: region || selectedRegions[0] || credentials?.region || 'us-east-1',
        targetGroupArn,
        targetId,
        targetPort,
        targetName: targets?.[0]?.targetName || targetId, // Pass target name
        accountId: selectedAccountId, // Pass accountId for email
        healthyCount: healthyCount || 0, // Pass healthy count
        unhealthyDeletedCount: unhealthyCount || 1, // Pass unhealthy deleted count
      });
      
      setSuccess('Target deregistered successfully');
      setDeregisterDialog({ open: false, targetGroupArn: '', targetId: '', targetPort: '', region: '' });
      
      // Note: The parent component should handle the refresh
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to deregister target';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setDeregisterLoading(false);
    }
  };

  // Handle instance termination
  const handleTerminateInstance = async ({ region, instanceId }) => {
    if (!credentials) return { success: false };
    if (!instanceId) return { success: false };

    try {
      await AwsAlbApiService.terminateInstance({
        ...credentials,
        region: region || selectedRegions[0] || credentials?.region || 'us-east-1',
        instanceId,
      });
      
      return { success: true, instanceId };
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to terminate instance';
      return { success: false, error: msg };
    }
  };

  // Show unhealthy target details for a specific target group
  const handleShowUnhealthyDetails = async (targetGroupArn, targetGroupName, regionOverride) => {
    setUnhealthyDetailsDialog({
      open: true,
      targetGroupArn,
      targetGroupName,
      loading: true,
      data: null,
    });
    
    try {
      const response = await AwsAlbApiService.getUnhealthyTargetDetails({
        ...credentials,
        targetGroupArn,
        region: regionOverride || selectedRegions[0] || credentials?.region || 'us-east-1',
      });
      
      setUnhealthyDetailsDialog(prev => ({
        ...prev,
        loading: false,
        data: response,
      }));
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch unhealthy target details');
      setUnhealthyDetailsDialog(prev => ({
        ...prev,
        loading: false,
        open: false,
      }));
    }
  };

  // Show all unhealthy targets across all target groups
  const handleShowAllUnhealthyDetails = async () => {
    const albsToProcess = Array.isArray(albs) ? albs : [];
    const unhealthyTargets = [];
    const seenTargetGroups = new Set();

    for (const alb of albsToProcess) {
      const albRegion = alb?.region || credentials?.region || selectedRegions?.[0] || 'us-east-1';
      const tgByArn = new Map((alb?.targetGroups || []).map((tg) => [tg?.targetGroupArn, tg]));

      for (const health of alb?.targetGroupHealth || []) {
        const tgArn = health?.targetGroupArn;
        if (!tgArn) continue;

        const tg = tgByArn.get(tgArn);
        const tgName = tg?.targetGroupName || 'Unknown';

        const targets = Array.isArray(health?.targets) ? health.targets : [];
        for (const t of targets) {
          const id = t?.targetId || t?.id;
          const port = t?.port;
          const healthState = t?.health;
          if (!id || !port) continue;
          if (healthState !== 'unhealthy') continue;

          unhealthyTargets.push({
            id,
            port,
            health: healthState,
            targetGroupArn: tgArn,
            targetGroupName: tgName,
            region: albRegion,
            albName: alb?.loadBalancerName || 'Unknown',
            albType: alb?.type || 'unknown',
          });
        }

        seenTargetGroups.add(`${albRegion}::${tgArn}`);
      }
    }

    if (unhealthyTargets.length === 0) {
      setToast({ open: true, message: 'No unhealthy targets found', severity: 'info' });
      return;
    }

    setUnhealthyDetailsDialog({
      open: true,
      targetGroupArn: '',
      targetGroupName: 'All Target Groups',
      loading: true,
      data: null,
    });

    try {
      const targetGroupRequests = Array.from(seenTargetGroups).map((key) => {
        const [region, targetGroupArn] = key.split('::');
        return AwsAlbApiService.getUnhealthyTargetDetails({
          ...credentials,
          targetGroupArn,
          region,
        }).then((resp) => ({ region, targetGroupArn, resp }));
      });

      const results = await Promise.allSettled(targetGroupRequests);
      const ok = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value);

      const mergedUnhealthyTargets = [];
      const mergedSummary = {
        healthyCount: 0,
        unhealthyCount: 0,
        unknownCount: 0,
      };

      for (const item of ok) {
        const { region, targetGroupArn, resp } = item;
        const summary = resp?.summary || {};
        mergedSummary.healthyCount += Number(summary.healthyCount || 0);
        mergedSummary.unhealthyCount += Number(summary.unhealthyCount || 0);
        mergedSummary.unknownCount += Number(summary.unknownCount || 0);

        const apiTargets = Array.isArray(resp?.unhealthyTargets) ? resp.unhealthyTargets : [];
        const meta = unhealthyTargets.find(
          (t) => t.targetGroupArn === targetGroupArn && t.region === region
        );

        for (const t of apiTargets) {
          mergedUnhealthyTargets.push({
            ...t,
            targetGroupArn,
            targetGroupName: meta?.targetGroupName || 'Unknown',
            region,
            albName: meta?.albName || 'Unknown',
            albType: meta?.albType || 'unknown',
          });
        }
      }

      setUnhealthyDetailsDialog((prev) => ({
        ...prev,
        loading: false,
        data: {
          mode: 'all',
          summary: mergedSummary,
          unhealthyTargets: mergedUnhealthyTargets,
        },
      }));
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch unhealthy target details');
      setUnhealthyDetailsDialog((prev) => ({
        ...prev,
        loading: false,
        open: false,
      }));
    }
  };

  // Close unhealthy details dialog
  const handleCloseUnhealthyDetails = () => {
    setUnhealthyDetailsDialog({
      open: false,
      targetGroupArn: '',
      targetGroupName: '',
      loading: false,
      data: null,
    });
  };

  // Auto-deregister unhealthy targets
  const runAutoDeregisterOnce = async () => {
    if (!autoDeregisterEnabled) return;
    if (autoDeregisterInFlightRef.current) return;
    if (!credentials) return;
    if (!selectedRegions || selectedRegions.length === 0) return;

    autoDeregisterInFlightRef.current = true;
    const results = [];

    try {
      const albsToProcess = Array.isArray(albs) ? albs : [];
      console.log('🔧 Auto-deregister: Processing', albsToProcess.length, 'ALBs');

      for (const alb of albsToProcess) {
        const albRegion = alb?.region || selectedRegions[0] || credentials?.region || 'us-east-1';
        console.log('🔧 Processing ALB:', alb.loadBalancerName, 'Type:', alb.type, 'Region:', albRegion);

        for (const tg of alb?.targetGroups || []) {
          const targetGroupArn = tg?.targetGroupArn;
          if (!targetGroupArn) {
            console.log('🔧 Skipping target group - no ARN');
            continue;
          }

          const realTimeHealth = (alb?.targetGroupHealth || []).find(
            (health) => health && health.targetGroupArn === targetGroupArn
          );

          const targets = (realTimeHealth?.targets || []).map((t) => ({
            Id: t?.targetId || t?.id || '',
            Port: t?.port || tg?.port || 80,
            Health: t?.health || 'unknown',
          }));

          console.log(`🔧 Target Group ${tg.targetGroupName}: Found ${targets.length} targets`);

          for (const target of targets) {
            if (target?.Health !== 'unhealthy') {
              console.log(`🔧 Target ${target.Id} is ${target.Health} - skipping`);
              continue;
            }
            if (!target?.Id) {
              console.log('🔧 Target has no ID - skipping');
              continue;
            }

            const key = `${albRegion}|${targetGroupArn}|${target?.Id || ''}|${target?.Port || ''}`;
            if (autoDeregisterAttemptedRef.current.has(key)) {
              console.log(`🔧 Target ${target.Id} already attempted - skipping`);
              continue;
            }
            autoDeregisterAttemptedRef.current.add(key);

            console.log(` Auto-deregistering unhealthy target ${target.Id}${target.Port ? `:${target.Port}` : ''} from ${alb.loadBalancerName}`);

            try {
              await AwsAlbApiService.deregisterTarget({
                ...credentials,
                region: albRegion,
                targetGroupArn,
                targetId: target.Id,
                targetPort: target.Port,
              });

              results.push({
                success: true,
                targetId: target.Id,
                targetPort: target.Port,
                albName: alb.loadBalancerName,
                action: 'deregistered'
              });
            } catch (deregError) {
              console.error(`Failed to deregister target ${target.Id}:`, deregError);
              results.push({
                success: false,
                targetId: target.Id,
                targetPort: target.Port,
                albName: alb.loadBalancerName,
                action: 'deregister_failed',
                error: deregError.message
              });
            }
          }
        }
      }

      return results;
    } finally {
      autoDeregisterInFlightRef.current = false;
    }
  };

  // Auto-deregister effect - DISABLED - Now using backend APIs
  useEffect(() => {
    // Old auto-deregister logic is disabled
    // Auto actions are now handled by backend APIs via AlbAutoActionsApiService
    console.log('🔄 Auto-deregister effect disabled - using backend APIs instead');
    
    // Return empty cleanup function
    return () => {};
  }, [autoDeregisterEnabled, credentials, selectedRegions, albs]);

  // UI-driven unhealthy email notifications
  useEffect(() => {
    let cancelled = false;
    let intervalId = null;

    const sendNow = async () => {
      try {
        const unhealthyTargets = getAllUnhealthyTargets(targetGroups, albs, true);
        if (!Array.isArray(unhealthyTargets) || unhealthyTargets.length === 0) return;

        await HealthMonitorApiService.notifyUnhealthyFromUI({
          unhealthyTargets,
          totalTargets: unhealthyTargets.length,
        });
      } catch (e) {
        console.error('Failed to send UI unhealthy email:', e);
      }
    };

    const shouldRun = Boolean(emailConfig?.emailsEnabled !== false) && 
                       getAllUnhealthyTargets(targetGroups, albs, true).length > 0;

    if (shouldRun) {
      sendNow();
      intervalId = setInterval(() => {
        if (cancelled) return;
        sendNow();
      }, 5 * 60 * 1000);
    }

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [emailConfig?.emailsEnabled, targetGroups, albs]);

  return {
    // State
    deregisterDialog,
    deregisterLoading,
    autoDeregisterConfirmOpen,
    unhealthyDetailsDialog,
    
    // Actions
    handleOpenDeregisterDialog,
    handleDeregisterTarget,
    handleTerminateInstance,
    handleShowUnhealthyDetails,
    handleShowAllUnhealthyDetails,
    handleCloseUnhealthyDetails,
    runAutoDeregisterOnce,
    
    // Setters
    setDeregisterDialog,
    setAutoDeregisterConfirmOpen,
    setUnhealthyDetailsDialog,
    
    // Refs
    autoDeregisterAttemptedRef,
  };
};
