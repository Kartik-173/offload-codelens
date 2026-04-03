import { useState, useEffect, useRef } from 'react';
import CredentialsApiService from '../../services/CredentialsApiService';
import AlbAccountSettingsApiService from '../../services/AlbAccountSettingsApiService';
import AlbAutoActionsApiService from '../../services/AlbAutoActionsApiService';
import { getSelectedAccountStorageKey, getUserId } from '../../utils/Helpers';

export const useAwsCredentials = (selectedRegions, onAccountChange) => {
  const [storedCredentials, setStoredCredentials] = useState(null);
  const [accountIds, setAccountIds] = useState([]);
  const [accountIdToName, setAccountIdToName] = useState({});
  const [selectedAccountId, setSelectedAccountId] = useState(() => {
    try {
      const saved = localStorage.getItem(getSelectedAccountStorageKey());
      return saved ? String(saved) : '';
    } catch (e) {
      return '';
    }
  });
  const [accountSettingsLoading, setAccountSettingsLoading] = useState(false);
  const [autoDeregisterEnabled, setAutoDeregisterEnabled] = useState(false);
  const [error, setError] = useState('');

  // Load account settings from backend
  const loadAccountSettings = async (accountId, storedCredentials, selectedRegions) => {
    if (!accountId) return;
    
    try {
      setAccountSettingsLoading(true);
      console.log('🔧 Loading ALB settings for account:', accountId);
      
      // Load account settings and auto deregister state in parallel
      const [settingsResponse, deregisterStateResponse] = await Promise.all([
        AlbAccountSettingsApiService.getAccountSettings(accountId),
        AlbAutoActionsApiService.getAutoDeregisterState(accountId).catch((error) => {
          console.log('⚠️ Failed to load auto deregister state:', error.message);
          return { data: { data: { state: null } } };
        })
      ]);
      
      console.log('📊 API Responses:', {
        settingsResponse: settingsResponse?.data,
        deregisterStateResponse: deregisterStateResponse?.data
      });
      
      // Process account settings
      let accountAutoDeregisterEnabled = false;
      
      
      if (settingsResponse?.data) {
        const settings = settingsResponse.data;
        console.log('✅ Loaded ALB settings:', settings);
        accountAutoDeregisterEnabled = settings.autoDeregisterEnabled || false;
      } else {
        console.log('ℹ️ No ALB settings found for account, using defaults');
      }
      
      // Process auto deregister state - this determines the actual toggle state
      // NOTE: API response structure is { data: { data: { state: ... } } }
      const deregisterState = deregisterStateResponse?.data?.data?.state;
      let actualAutoDeregisterEnabled = accountAutoDeregisterEnabled;
      
      if (deregisterState) {
        console.log('✅ Loaded auto deregister state:', deregisterState);
        // The actual state should reflect the isActive flag from the state table
        actualAutoDeregisterEnabled = deregisterState.isActive || false;
        
        // If the state shows it's active but account settings don't, update account settings
        if (actualAutoDeregisterEnabled && !accountAutoDeregisterEnabled) {
          console.log('🔄 Syncing account settings to match active auto deregister state');
          try {
            await AlbAccountSettingsApiService.updateAccountSettings(accountId, {
              autoDeregisterEnabled: true
            });
          } catch (syncError) {
            console.warn('⚠️ Failed to sync account settings:', syncError);
          }
        }
      } else {
        console.log('ℹ️ No auto deregister state found, using account settings');
      }
      
      console.log('🔧 Final auto deregister state:', {
        accountSettings: accountAutoDeregisterEnabled,
        actualState: actualAutoDeregisterEnabled,
        source: deregisterState ? 'state-table' : 'account-settings',
        deregisterStateExists: !!deregisterState
      });
      
      // Update the state
      setAutoDeregisterEnabled(actualAutoDeregisterEnabled);
      
      console.log('🎯 State updated in UI:', {
        autoDeregisterEnabled: actualAutoDeregisterEnabled,
      });
      
    } catch (error) {
      console.error('❌ Failed to load ALB settings:', error);
      setAutoDeregisterEnabled(false);
    } finally {
      setAccountSettingsLoading(false);
      console.log('📝 Account settings loading completed');
    }
  };

  // Save account settings to backend
  const saveAccountSettings = async (accountId, settings) => {
    console.log('🔧 saveAccountSettings called with:', { accountId, settings });
    
    if (!accountId) {
      console.warn('⚠️ No accountId provided to saveAccountSettings, skipping API call');
      return;
    }
    
    try {
      console.log('🔧 Saving ALB settings for account:', accountId, settings);
      
      const response = await AlbAccountSettingsApiService.updateAccountSettings(accountId, settings);
      
      if (response?.data?.data) {
        console.log('✅ Saved ALB settings successfully');
        
        // Update local state after successful save
        if (settings.autoDeregisterEnabled !== undefined) {
          console.log('🔄 Updating local autoDeregisterEnabled state to:', settings.autoDeregisterEnabled);
          setAutoDeregisterEnabled(settings.autoDeregisterEnabled);
        }
        
        return response.data.data;
      }
    } catch (error) {
      console.error('❌ Failed to save ALB settings:', error);
      throw error;
    }
  };

  // Fetch stored credentials
  const fetchStoredCredentials = async () => {
    try {
      const userId = getUserId();
      console.log('🔑 Fetching stored credentials for user:', userId);
      
      const response = await CredentialsApiService.listAccountIds(userId);
      console.log('📋 Account IDs response:', response);

      const payload = response?.data?.data || response?.data || {};
      const accountIdsResp = payload.accountIds || [];
      const accountsResp = Array.isArray(payload.accounts) ? payload.accounts : null;
      const normalizedIds = accountIdsResp.map((id) => String(id));
      const nameMap = accountsResp
        ? accountsResp.reduce((acc, a) => {
            const id = String(a?.accountId ?? a?.id ?? '');
            if (!id) return acc;
            acc[id] = a?.name || '';
            return acc;
          }, {})
        : {};

      if (normalizedIds.length > 0) {
        console.log('✅ Found', normalizedIds.length, 'account IDs:', normalizedIds);
        
        setAccountIds(normalizedIds);
        setAccountIdToName(nameMap);
        
        const preferredAccountId = selectedAccountId && normalizedIds.includes(String(selectedAccountId))
          ? String(selectedAccountId)
          : normalizedIds[0];

        const accountId = preferredAccountId;
        console.log('🔍 Getting credentials for account:', accountId);
        
        const credsResponse = await CredentialsApiService.getCredentials(userId, accountId);
        console.log('🔐 Credentials response:', credsResponse);
        
        if (credsResponse && credsResponse.data && credsResponse.data.creds) {
          const credentials = {
            accountId: String(accountId),
            accessKeyId: credsResponse.data.creds.access_key,
            secretAccessKey: credsResponse.data.creds.secret_key,
            ...(credsResponse.data.creds.session_token && { sessionToken: credsResponse.data.creds.session_token }),
            region: selectedRegions[0] || 'us-east-1',
          };
          console.log('✅ Successfully retrieved AWS credentials for account:', credentials.accountId);
          setStoredCredentials(credentials);
          
          await loadAccountSettings(accountId, credentials, selectedRegions);
          
          if (!selectedAccountId || String(selectedAccountId) !== String(accountId)) {
            setSelectedAccountId(accountId);
            try {
              localStorage.setItem(getSelectedAccountStorageKey(), String(accountId));
            } catch (e) {
            }
          }
          
          return true;
        } else {
          console.error('❌ No credentials found in response for account:', accountId);
          setError('No AWS credentials found for the selected account. Please check your cloud credential configuration.');
          setStoredCredentials(null);
          return false;
        }
      } else {
        console.log('ℹ️ No AWS account IDs found for user.');
        setError('No AWS accounts found. Please add AWS credentials first.');
        setStoredCredentials(null);
        setAccountIds([]);
        setAccountIdToName({});
        setSelectedAccountId('');
        try {
          localStorage.removeItem(getSelectedAccountStorageKey());
        } catch (e) {
        }
        return false;
      }
    } catch (err) {
      console.error('❌ Error fetching stored credentials:', err);
      setError('Failed to fetch stored AWS credentials.');
      setStoredCredentials(null);
      setAccountIds([]);
      setAccountIdToName({});
      setSelectedAccountId('');
      try {
        localStorage.removeItem(getSelectedAccountStorageKey());
      } catch (e) {
      }
      return false;
    }
  };

  // Handle account change
  const handleAccountChange = async (newAccountId) => {
    console.log('🔄 Account changed to:', newAccountId);
    console.log('🔄 Previous account ID:', selectedAccountId);
    
    if (newAccountId === selectedAccountId) {
      console.log('⚠️ Same account selected, no action needed');
      return;
    }
    
    setSelectedAccountId(newAccountId);
    try {
      localStorage.setItem(getSelectedAccountStorageKey(), String(newAccountId));
    } catch (e) {
    }

    // Clear existing data
    setStoredCredentials(null);
    setError('');
    
    // Load account settings for new account
    await loadAccountSettings(newAccountId, null, []);
    
    // Fetch credentials for new account
    const userId = getUserId();
    console.log('🔑 Fetching credentials for user:', userId, 'account:', newAccountId);
    
    try {
      const credsResponse = await CredentialsApiService.getCredentials(userId, newAccountId);
      console.log('🔐 New credentials response:', credsResponse);
      
      if (credsResponse && credsResponse.data && credsResponse.data.creds) {
        const credentials = {
          accountId: String(newAccountId),
          accessKeyId: credsResponse.data.creds.access_key,
          secretAccessKey: credsResponse.data.creds.secret_key,
          ...(credsResponse.data.creds.session_token && { sessionToken: credsResponse.data.creds.session_token }),
          region: selectedRegions[0] || 'us-east-1',
        };
        console.log('✅ Successfully retrieved credentials for new account:', credentials.accountId);
        setStoredCredentials(credentials);
        
        if (onAccountChange) {
          onAccountChange(newAccountId, credentials);
        }
      } else {
        console.error('❌ No credentials found for account:', newAccountId);
        setError('No AWS credentials found for the selected account.');
        setStoredCredentials(null);
      }
    } catch (err) {
      console.error('❌ Error fetching credentials for new account:', err);
      setError(`Failed to fetch credentials: ${err.message}`);
      setStoredCredentials(null);
    }
  };

  // Debug function to check available tokens and API connectivity
  const debugCredentials = async () => {
    try {
      console.log('🔍 === CREDENTIAL DEBUG START ===');
      
      // Check tokens
      const idToken = localStorage.getItem('id_token');
      const accessToken = localStorage.getItem('access_token');
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      
      console.log('🔍 Token Debug Info:');
      console.log('  id_token:', idToken ? `${idToken.substring(0, 20)}...` : 'null');
      console.log('  access_token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'null');
      console.log('  token:', token ? `${token.substring(0, 20)}...` : 'null');
      console.log('  userId:', userId);
      
      // Test credential API
      try {
        console.log('🔐 Testing credential API...');
        const userId = getUserId();
        console.log('👤 Testing with userId:', userId);
        
        if (userId !== 'unknown') {
          console.log('📋 Testing listAccountIds...');
          const accountIdsResponse = await CredentialsApiService.listAccountIds(userId);
          console.log('📋 listAccountIds response:', accountIdsResponse);
          
          if (accountIdsResponse && accountIdsResponse.data && accountIdsResponse.data.accountIds && accountIdsResponse.data.accountIds.length > 0) {
            console.log('✅ Found account IDs:', accountIdsResponse.data.accountIds);
            
            const accountId = accountIdsResponse.data.accountIds[0];
            console.log('🔍 Testing getCredentials for account:', accountId);
            
            const credsResponse = await CredentialsApiService.getCredentials(userId, accountId);
            console.log('🔐 getCredentials response:', credsResponse);
            
            if (credsResponse && credsResponse.data && credsResponse.data.creds) {
              console.log('✅ SUCCESS: Credentials retrieved successfully!');
              console.log('📊 Account ID:', credsResponse.data.creds.aws_account_id);
              console.log('🔑 Access Key:', credsResponse.data.creds.access_key ? '✅ Available' : '❌ Missing');
              console.log('🗝️ Secret Key:', credsResponse.data.creds.secret_key ? '✅ Available' : '❌ Missing');
            } else {
              console.log('❌ No credentials found in response');
            }
          } else {
            console.log('❌ No account IDs found for user');
          }
        } else {
          console.log('❌ Invalid userId:', userId);
        }
      } catch (credError) {
        console.error('❌ Credential API error:', credError);
      }
      
      console.log('🔍 === CREDENTIAL DEBUG END ===');
      
      return { idToken, accessToken, token, userId };
    } catch (debugError) {
      console.error('❌ Debug function error:', debugError);
      return { idToken: null, accessToken: null, token: null, userId: null };
    }
  };

  // Load credentials on component mount
  useEffect(() => {
    console.log('🚀 useAwsCredentials hook mounted, starting credential process...');
    const loadCredentials = async () => {
      try {
        console.log('🔄 Starting credential loading...');
        await debugCredentials();
        
        const success = await fetchStoredCredentials();
        if (success) {
          console.log('✅ AWS credentials loaded successfully');
        } else {
          console.log('❌ Failed to load AWS credentials');
        }
      } catch (error) {
        console.error('❌ Error in loadCredentials:', error);
      }
    };
    
    loadCredentials();
  }, []);

  // Load account settings when selectedAccountId changes
  useEffect(() => {
    if (selectedAccountId && storedCredentials) {
      console.log('🔄 Loading account settings for selectedAccountId:', selectedAccountId);
      loadAccountSettings(selectedAccountId, storedCredentials, selectedRegions);
    }
  }, [selectedAccountId, storedCredentials, selectedRegions]);

  return {
    // State
    storedCredentials,
    accountIds,
    accountIdToName,
    selectedAccountId,
    accountSettingsLoading,
    autoDeregisterEnabled,
    error,
    
    // Actions
    fetchStoredCredentials,
    handleAccountChange,
    saveAccountSettings,
    loadAccountSettings,
    debugCredentials,
    setAutoDeregisterEnabled,
    setError,
    
    // Computed
    hasCredentials: !!storedCredentials,
    hasMultipleAccounts: accountIds.length > 1,
  };
};
