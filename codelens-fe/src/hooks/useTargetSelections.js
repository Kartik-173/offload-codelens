import { useState, useEffect, useCallback } from 'react';
import userTargetSelectionsApiService from '../services/UserTargetSelectionsApiService';

export const useTargetSelections = () => {
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [excludedTargets, setExcludedTargets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to get current user ID to detect auth changes
  const getCurrentUserId = useCallback(() => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('id_token') || localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload['cognito:username'] || null;
    } catch (e) {
      return null;
    }
  }, []);

  // Load user selections whenever auth state changes
  const loadUserSelections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [selectionsResponse, excludedResponse] = await Promise.all([
        userTargetSelectionsApiService.getUserTargetSelections(),
        userTargetSelectionsApiService.getExcludedTargets()
      ]);

      setSelectedTargets(selectionsResponse?.selectedTargets || []);
      setExcludedTargets(excludedResponse || []);
    } catch (err) {
      console.error('Failed to load user selections:', err);
      setError(err.message || 'Failed to load selections');
      // Clear selections on error to prevent stale state
      setSelectedTargets([]);
      setExcludedTargets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Monitor authentication changes
  useEffect(() => {
    let lastUserId = getCurrentUserId();
    
    const handleStorageChange = (e) => {
      if (e.key === 'access_token' || e.key === 'id_token' || e.key === 'token') {
        const newUserId = getCurrentUserId();
        if (newUserId !== lastUserId) {
          lastUserId = newUserId;
          if (newUserId) {
            // User signed in or changed
            loadUserSelections();
          } else {
            // User signed out
            setSelectedTargets([]);
            setExcludedTargets([]);
            setError(null);
          }
        }
      }
    };

    // Listen for storage changes (for cross-tab sync)
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for auth changes (for same-tab updates)
    const authCheckInterval = setInterval(() => {
      const currentUserId = getCurrentUserId();
      if (currentUserId !== lastUserId) {
        lastUserId = currentUserId;
        if (currentUserId) {
          loadUserSelections();
        } else {
          setSelectedTargets([]);
          setExcludedTargets([]);
          setError(null);
        }
      }
    }, 1000);

    // Initial load if user is authenticated
    if (lastUserId) {
      loadUserSelections();
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(authCheckInterval);
    };
  }, [getCurrentUserId, loadUserSelections]);

  // Save selections to backend
  const saveSelections = useCallback(async (targets) => {
    try {
      setLoading(true);
      setError(null);
      
      await userTargetSelectionsApiService.saveUserTargetSelections({
        selectedTargets: targets
      });
      
      setSelectedTargets(targets);
    } catch (err) {
      console.error('Failed to save selections:', err);
      setError(err.message || 'Failed to save selections');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle target selection with automatic save
  const toggleTargetSelection = useCallback(async (targetInfo) => {
    setSelectedTargets(prev => {
      const exists = prev.some(t => {
        const sameId = (t.targetId || t.id) === (targetInfo.targetId || targetInfo.id);
        const samePort = t.port === targetInfo.port;
        const sameGroup = (t.targetGroupArn || null) === (targetInfo.targetGroupArn || null);
        return sameId && samePort && sameGroup;
      });
      
      let newSelections;
      if (exists) {
        newSelections = prev.filter(t => {
          const sameId = (t.targetId || t.id) === (targetInfo.targetId || targetInfo.id);
          const samePort = t.port === targetInfo.port;
          const sameGroup = (t.targetGroupArn || null) === (targetInfo.targetGroupArn || null);
          return !(sameId && samePort && sameGroup);
        });
      } else {
        newSelections = [...prev, { ...targetInfo, selectedAt: new Date() }];
      }
      
      // Auto-save to backend
      saveSelections(newSelections);
      return newSelections;
    });
  }, [saveSelections]);

  // Check if target is selected
  const isTargetSelected = useCallback((targetId, port, targetGroupArn) => {
    return selectedTargets.some(t => {
      const sameId = (t.targetId || t.id) === targetId;
      const samePort = t.port === port;
      if (targetGroupArn) {
        return sameId && samePort && t.targetGroupArn === targetGroupArn;
      }
      return sameId && samePort;
    });
  }, [selectedTargets]);

  // Check if target is excluded from auto-deregistration
  const isTargetExcluded = useCallback((targetId, port, targetGroupArn) => {
    return excludedTargets.some(t => {
      const sameId = t.targetId === targetId;
      const samePort = t.port === port;
      if (targetGroupArn) {
        return sameId && samePort && t.targetGroupArn === targetGroupArn;
      }
      return sameId && samePort;
    });
  }, [excludedTargets]);

  // Add target to excluded list
  const excludeTargetFromAutoDeregister = useCallback(async (targetInfo) => {
    try {
      setLoading(true);
      setError(null);
      
      await userTargetSelectionsApiService.addTargetToExcludedList(targetInfo);
      
      // Refresh excluded targets
      const excludedResponse = await userTargetSelectionsApiService.getExcludedTargets();
      setExcludedTargets(excludedResponse || []);
      
      // Also remove from selected targets if it was selected
      if (isTargetSelected(targetInfo.targetId || targetInfo.id, targetInfo.port, targetInfo.targetGroupArn)) {
        toggleTargetSelection(targetInfo);
      }
    } catch (err) {
      console.error('Failed to exclude target:', err);
      setError(err.message || 'Failed to exclude target');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isTargetSelected, toggleTargetSelection]);

  // Remove target from excluded list
  const removeTargetExclusion = useCallback(async (targetId, port) => {
    try {
      setLoading(true);
      setError(null);
      
      await userTargetSelectionsApiService.removeTargetFromExclusion(targetId, port);
      
      // Refresh excluded targets
      const excludedResponse = await userTargetSelectionsApiService.getExcludedTargets();
      setExcludedTargets(excludedResponse || []);
    } catch (err) {
      console.error('Failed to remove target exclusion:', err);
      setError(err.message || 'Failed to remove target exclusion');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Select all targets in a target group
  const selectAllTargetsInGroup = useCallback((targets, targetGroupArn, targetGroupName) => {
    const targetsToSelect = targets.map(target => ({
      ...target,
      targetGroupArn,
      targetGroupName,
      selectedAt: new Date()
    }));
    
    const newSelections = [
      ...selectedTargets.filter(t => t.targetGroupArn !== targetGroupArn),
      ...targetsToSelect
    ];
    
    saveSelections(newSelections);
  }, [selectedTargets, saveSelections]);

  // Deselect all targets in a target group
  const deselectAllTargetsInGroup = useCallback((targetGroupArn) => {
    const newSelections = selectedTargets.filter(t => t.targetGroupArn !== targetGroupArn);
    saveSelections(newSelections);
  }, [selectedTargets, saveSelections]);

  // Select all unhealthy targets across all groups
  const selectAllUnhealthyTargets = useCallback((allTargetGroups) => {
    const unhealthyTargets = [];
    
    allTargetGroups.forEach(tg => {
      tg.targets.forEach(target => {
        if (target.health === 'unhealthy') {
          unhealthyTargets.push({
            ...target,
            targetGroupArn: tg.targetGroupArn,
            targetGroupName: tg.targetGroupName,
            selectedAt: new Date()
          });
        }
      });
    });
    
    saveSelections(unhealthyTargets);
  }, [saveSelections]);

  // Clear all selections
  const clearAllSelections = useCallback(() => {
    saveSelections([]);
  }, [saveSelections]);

  // Enhanced auto-deregister that respects exclusions
  const performAutoDeregister = useCallback(async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await userTargetSelectionsApiService.autoDeregisterUnhealthyTargets(credentials);
      
      return result;
    } catch (err) {
      console.error('Auto-deregister failed:', err);
      setError(err.message || 'Auto-deregister failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    selectedTargets,
    excludedTargets,
    loading,
    error,
    
    // Actions
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
    loadUserSelections,
    saveSelections,
    
    // Computed
    selectedCount: selectedTargets.length,
    excludedCount: excludedTargets.length,
    hasSelections: selectedTargets.length > 0,
    hasExclusions: excludedTargets.length > 0
  };
};
