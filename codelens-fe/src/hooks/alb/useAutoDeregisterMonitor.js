import { useState, useEffect, useRef } from 'react';
import AlbAutoActionsApiService from '../../services/AlbAutoActionsApiService';
import DebugService from '../../services/DebugService';

const useAutoDeregisterMonitor = (accountId, onActivityDetected) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastActivity, setLastActivity] = useState(null);
  const [error, setError] = useState('');
  const intervalRef = useRef(null);
  const lastCheckRef = useRef(new Date().toISOString());

  // Start monitoring for auto-deregister activity
  const startMonitoring = () => {
    if (isMonitoring || !accountId) return;
    
    console.log('🔍 Starting auto-deregister activity monitoring for account:', accountId);
    setIsMonitoring(true);
    setError('');
    
    // Check every 30 seconds
    intervalRef.current = setInterval(async () => {
      try {
        const response = await AlbAutoActionsApiService.getLatestActivity(
          accountId, 
          lastCheckRef.current
        );

        if (response.data?.success && response.data?.data) {
          const activity = response.data.data;

          // Always keep latest state for UI display (runStatus/errorMessage/lastRunAt)
          setLastActivity(activity);

          if (activity.hasNewActivity) {
            console.log('🔄 Auto-deregister activity detected:', activity);
            lastCheckRef.current = new Date().toISOString();

            // Trigger callback to refresh UI data
            if (onActivityDetected && typeof onActivityDetected === 'function') {
              onActivityDetected(activity);
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to check auto-deregister activity:', error.message);
        // Don't set error state for occasional failures, just log
      }
    }, 30000); // 30 seconds
  };

  // Stop monitoring
  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsMonitoring(false);
    console.log('⏹️ Stopped auto-deregister activity monitoring');
  };

  // Auto-start when accountId changes
  useEffect(() => {
    if (accountId) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
    
    return () => stopMonitoring();
  }, [accountId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopMonitoring();
  }, []);

  return {
    isMonitoring,
    lastActivity,
    error,
    startMonitoring,
    stopMonitoring
  };
};

export default useAutoDeregisterMonitor;
