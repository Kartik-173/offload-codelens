import { useState, useEffect, useRef, useCallback } from 'react';
import AwsAlbApiService from '../../services/AwsAlbApiService';
import AlbCloudWatchApiService from '../../services/AlbCloudWatchApiService';
import AlbMemoryApiService from '../../services/AlbMemoryApiService';
import HealthMonitorApiService from '../../services/HealthMonitorApiService';

export const useAlbData = (credentials, selectedRegions, autoRefreshEnabled = true) => {
  const [albs, setAlbs] = useState([]);
  const [targetGroups, setTargetGroups] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const [memoryStats, setMemoryStats] = useState(null);
  const [healthMonitorStatus, setHealthMonitorStatus] = useState(null);
  const [refreshStatus, setRefreshStatus] = useState(null);
  const [refreshInterval] = useState(5 * 60 * 1000); // 5 minutes

  // Refs for managing fetch state
  const didInitialAutoFetchRef = useRef(false);
  const bypassMemoryRef = useRef(false);
  const refreshTimerRef = useRef(null);

  // Fetch ALBs from AWS with real-time CloudWatch metrics
  const fetchAlbsFromAWS = useCallback(async (creds) => {
    console.log('🚀 fetchAlbsFromAWS called for regions:', selectedRegions);
    
    if (!creds || !selectedRegions || selectedRegions.length === 0) {
      console.error('❌ Missing credentials or regions for ALB fetch');
      throw new Error('Credentials and regions are required for fetching ALBs');
    }

    try {
      console.log('Fetching ALBs using CloudWatch real-time API for regions:', selectedRegions);
      
      const response = await AlbCloudWatchApiService.fetchAlbsWithRealTimeMetrics(selectedRegions, creds);
      
      if (response.status === 'success') {
        const albs = response.data.albData || [];
        const targetGroups = {};
        
        console.log('🔍 Real-time ALB data from CloudWatch:', albs);
        console.log('🔍 Number of ALBs received:', albs.length);

        // Build targetGroups map for UI components that rely on it (StatusSummary, dialogs, etc.)
        albs.forEach(alb => {
          if (alb.targetGroups && Array.isArray(alb.targetGroups)) {
            alb.targetGroups.forEach(tg => {
              const tgKey = tg.targetGroupArn;
              if (!tgKey) return;
              targetGroups[tgKey] = {
                ...tg,
                region: alb.region,
                loadBalancerName: alb.loadBalancerName,
                loadBalancerArn: alb.loadBalancerArn,
              };
            });
          }
        });
        
        setAlbs(albs);
        setTargetGroups(targetGroups);
        setSuccess(`Successfully fetched ${albs.length} load balancers from ${selectedRegions.length} regions`);
        setLastFetchTime(new Date());
        
        console.log('✅ Real-time ALB data loaded successfully');
        
      } else {
        throw new Error(response.error?.message || 'Failed to fetch ALBs from CloudWatch API');
      }
      
    } catch (error) {
      console.error('❌ Error in fetchAlbsFromAWS:', error);
      setError(error.response?.data?.error?.message || error.message || 'Failed to fetch load balancers from AWS');
      throw error;
    }
  }, [selectedRegions]);

  // Direct ALB fetch that bypasses cached credentials
  const fetchAlbsDirectly = useCallback(async (creds) => {
    setLoading(true);
    setError('');
    
    try {
      if (selectedRegions.length === 0) {
        setError('Please select at least one region');
        setLoading(false);
        return;
      }

      console.log('🔄 Direct ALB fetch for account:', creds.accountId);
      
      const response = await AlbCloudWatchApiService.fetchAlbsWithRealTimeMetrics(selectedRegions, creds);
      
      if (response.status === 'success') {
        const albs = response.data.albData || [];
        const targetGroups = {};
        
        console.log('🔍 Real-time ALB data from CloudWatch:', albs);
        
        // Transform the real-time data to match the expected UI format
        albs.forEach(alb => {
          if (alb.targetGroups && Array.isArray(alb.targetGroups)) {
            console.log(`🔍 Processing ALB ${alb.loadBalancerName} with ${alb.targetGroups.length} target groups`);
            
            alb.targetGroups.forEach(tg => {
              const tgKey = tg.targetGroupArn;
              targetGroups[tgKey] = {
                ...tg,
                region: alb.region,
                loadBalancerName: alb.loadBalancerName,
                loadBalancerArn: alb.loadBalancerArn,
              };
            });
          }
        });
        
        setAlbs(albs);
        setTargetGroups(targetGroups);
        setSuccess(`Successfully fetched ${albs.length} load balancers from ${selectedRegions.length} regions for account ${creds.accountId}`);
        setLastFetchTime(new Date());
      } else {
        throw new Error(response.error?.message || 'Failed to fetch ALBs with real-time metrics');
      }
      
    } catch (err) {
      console.error('Error in fetchAlbsDirectly:', err);
      setError(err.response?.data?.error?.message || err.message || 'Failed to fetch load balancers with real-time metrics');
    } finally {
      setLoading(false);
    }
  }, [selectedRegions]);

  // Main fetch function
  const fetchAlbs = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      if (!credentials) {
        setError('No AWS credentials available');
        setLoading(false);
        return;
      }

      if (selectedRegions.length === 0) {
        setError('Please select at least one region');
        setLoading(false);
        return;
      }

      console.log('🔄 Fetching fresh ALB data from AWS API');
      await fetchAlbsFromAWS(credentials);
      
    } catch (error) {
      console.error('❌ Error in fetchAlbs:', error);
      setError(error.message || 'Failed to fetch load balancers');
    } finally {
      setLoading(false);
    }
  }, [credentials, selectedRegions, fetchAlbsFromAWS]);

  // Force fresh scan
  const handleForceFreshScan = useCallback(async () => {
    if (!credentials) return;

    bypassMemoryRef.current = true;
    didInitialAutoFetchRef.current = true;
    setRefreshStatus(null);

    try {
      await fetchAlbsFromAWS(credentials);
    } finally {
      bypassMemoryRef.current = false;
    }
  }, [credentials, fetchAlbsFromAWS]);

  // Load memory stats
  const loadMemoryStats = useCallback(async () => {
    try {
      const stats = await AlbMemoryApiService.getMemoryStats();
      setMemoryStats(stats);
    } catch (error) {
      console.error('Failed to load memory stats:', error);
    }
  }, []);

  // Auto-fetch on component mount when credentials and regions are available
  useEffect(() => {
    const autoFetchOnLoad = async () => {
      if (autoRefreshEnabled && 
          credentials && 
          selectedRegions.length > 0 && 
          !didInitialAutoFetchRef.current) {
        
        console.log('🚀 Auto-fetching ALBs on component load...');
        didInitialAutoFetchRef.current = true;

        try {
          await fetchAlbsFromAWS(credentials);
          setSuccess(`Auto-fetched ${selectedRegions.length} regions on load`);
        } catch (e) {
          console.error('Initial auto-fetch failed:', e);
          didInitialAutoFetchRef.current = false;
        }
      }
    };

    const timer = setTimeout(autoFetchOnLoad, 1000);
    return () => clearTimeout(timer);
  }, [autoRefreshEnabled, credentials, selectedRegions, fetchAlbsFromAWS]);

  // Auto-refresh polling
  useEffect(() => {
    if (!autoRefreshEnabled || !credentials || selectedRegions.length === 0) {
      return;
    }
    
    const id = setInterval(async () => {
      try {
        console.log('🔄 Auto-refresh: Fetching fresh load balancer data (5-minute interval)');
        await fetchAlbs();
        setSuccess('Auto-refreshed with latest load balancer data');
      } catch (e) {
        console.error('Auto refresh polling failed:', e);
        setError('Auto-refresh failed: ' + (e.message || 'Unknown error'));
      }
    }, refreshInterval);

    return () => clearInterval(id);
  }, [autoRefreshEnabled, credentials, selectedRegions, refreshInterval, fetchAlbs]);

  // Poll health monitor status
  useEffect(() => {
    let cancelled = false;

    const loadStatus = async () => {
      try {
        const status = await HealthMonitorApiService.getHealthMonitorStatus();
        if (!cancelled) {
          setHealthMonitorStatus(status?.data || null);
        }
      } catch (e) {
        console.error('Failed to fetch health monitor status:', e);
      }
    };

    loadStatus();
    const id = setInterval(loadStatus, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Load memory stats on mount
  useEffect(() => {
    loadMemoryStats();
  }, [loadMemoryStats]);

  return {
    // State
    albs,
    targetGroups,
    loading,
    error,
    success,
    lastFetchTime,
    memoryStats,
    healthMonitorStatus,
    refreshStatus,
    refreshInterval,
    
    // Actions
    fetchAlbs,
    fetchAlbsFromAWS,
    fetchAlbsDirectly,
    handleForceFreshScan,
    loadMemoryStats,
    setAlbs,
    setTargetGroups,
    setLastFetchTime,
    setError,
    setSuccess,
    
    // Computed
    hasData: albs.length > 0,
    regionCount: new Set(albs.map(alb => alb.region)).size,
    totalTargetGroups: Object.keys(targetGroups).length,
  };
};
