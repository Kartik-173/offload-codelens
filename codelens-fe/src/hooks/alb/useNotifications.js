import { useState } from 'react';
import UserEmailApiService from '../../services/UserEmailApiService';
import SlackIntegrationService from '../../services/SlackIntegrationService';
import HealthMonitorApiService from '../../services/HealthMonitorApiService';
import { ENV } from '../../config/env';

export const useNotifications = (setError, setSuccess, selectedAccountId) => {
  const [emailConfigDialog, setEmailConfigDialog] = useState({
    open: false,
    loading: false,
  });
  const [emailConfig, setEmailConfig] = useState({
    fromEmail: 'team@cloudsanalytics.ai',
    toEmails: [],
    emailsEnabled: false,
    interval: '5',
  });
  const [newEmail, setNewEmail] = useState('');

  // Slack Configuration Dialog State
  const [slackConfigDialog, setSlackConfigDialog] = useState({
    open: false,
    loading: false,
  });

  // Slack Integration State
  const [slackIntegration, setSlackIntegration] = useState({
    connected: false,
    teamName: null,
    channelName: null,
    webhookUrl: null,
    connectedAt: null,
    lastUsed: null,
  });
  const [slackLoading, setSlackLoading] = useState(false);

  // Email Configuration Functions
  const handleOpenEmailConfig = async () => {
    try {
      setEmailConfigDialog(prev => ({ ...prev, loading: true }));
      
      // Load email config and Slack integration status in parallel
      const [emailResponse] = await Promise.all([
        UserEmailApiService.getUserEmailConfig(selectedAccountId),
        handleLoadSlackIntegration()
      ]);
      
      if (emailResponse.status === 'success') {
        setEmailConfig({
          fromEmail: emailResponse.data.fromEmail || 'team@cloudsanalytics.ai',
          toEmails: emailResponse.data.toEmails || [],
          emailsEnabled: emailResponse.data.emailsEnabled !== false,
          interval: emailResponse.data.interval?.toString() || '5',
        });
      } else {
        // Set default values if no config exists
        setEmailConfig({
          fromEmail: 'team@cloudsanalytics.ai',
          toEmails: [],
          emailsEnabled: true,
          interval: '5',
        });
      }
    } catch (err) {
      console.error('Failed to get email config:', err);
      setError(err.response?.data?.error?.message || err.message || 'Failed to get email configuration');
      // Set default values on error
      setEmailConfig({
        fromEmail: 'team@cloudsanalytics.ai',
        toEmails: [],
        emailsEnabled: true,
        interval: '5',
      });
    } finally {
      setEmailConfigDialog(prev => ({ ...prev, loading: false }));
      setEmailConfigDialog(prev => ({ ...prev, open: true }));
    }
  };

  const handleCloseEmailConfig = () => {
    setEmailConfigDialog(prev => ({ ...prev, open: false }));
  };

  const handleUpdateEmailConfig = async () => {
    try {
      setEmailConfigDialog(prev => ({ ...prev, loading: true }));
      
      console.log('📧 Saving email configuration:', emailConfig);
      
      // Validate before sending
      if (!emailConfig.toEmails || emailConfig.toEmails.length === 0) {
        setError('At least one recipient email is required');
        setEmailConfigDialog(prev => ({ ...prev, loading: false }));
        return;
      }
      
      const configData = {
        accountId: selectedAccountId,
        fromEmail: emailConfig.fromEmail || 'team@cloudsanalytics.ai',
        toEmails: emailConfig.toEmails,
        emailsEnabled: emailConfig.emailsEnabled !== false,
        interval: parseInt(emailConfig.interval) || 5,
      };

      console.log('📧 Sending config data:', configData);

      const response = await UserEmailApiService.updateUserEmailConfig(configData);
      
      console.log('📧 Email config response:', response);
      
      if (response.status === 'success') {
        setSuccess('Email configuration updated successfully');
        setEmailConfig(response.data);
        handleCloseEmailConfig();
      } else {
        setError(response.error?.message || 'Failed to update email configuration');
      }
      setEmailConfigDialog(prev => ({ ...prev, loading: false }));
    } catch (err) {
      console.error('📧 Error updating email config:', err);
      setError(err.response?.data?.error?.message || err.message || 'Failed to update email configuration');
      setEmailConfigDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleRemoveEmail = async (emailToRemove) => {
    const currentEmails = emailConfig?.toEmails || [];
    const newEmails = currentEmails.filter(email => email !== emailToRemove);
    
    // Update local state immediately for responsive UI
    setEmailConfig(prev => ({
      ...prev,
      toEmails: newEmails
    }));
    
    // If this was the last email, delete the entire config
    if (newEmails.length === 0) {
      try {
        setEmailConfigDialog(prev => ({ ...prev, loading: true }));
        
        const response = await UserEmailApiService.deleteUserEmailConfig(selectedAccountId);
        
        if (response.status === 'success') {
          setSuccess('Email configuration deleted successfully');
          // Reset to default values
          setEmailConfig({
            fromEmail: 'team@cloudsanalytics.ai',
            toEmails: [],
            emailsEnabled: false,
            interval: '5',
          });
          handleCloseEmailConfig();
        } else {
          setError(response.error?.message || 'Failed to delete email configuration');
          // Revert the local state if API call failed
          setEmailConfig(prev => ({
            ...prev,
            toEmails: currentEmails
          }));
        }
        setEmailConfigDialog(prev => ({ ...prev, loading: false }));
      } catch (err) {
        console.error('📧 Error deleting email config:', err);
        setError(err.response?.data?.error?.message || err.message || 'Failed to delete email configuration');
        // Revert the local state if API call failed
        setEmailConfig(prev => ({
          ...prev,
          toEmails: currentEmails
        }));
        setEmailConfigDialog(prev => ({ ...prev, loading: false }));
      }
    }
  };

  const handleAddEmail = () => {
    if (newEmail && !(emailConfig?.toEmails || []).includes(newEmail)) {
      setEmailConfig(prev => ({
        ...prev,
        toEmails: [...(prev?.toEmails || []), newEmail]
      }));
      setNewEmail('');
    }
  };

  // Slack Configuration Functions
  const handleOpenSlackConfig = () => {
    setSlackConfigDialog(prev => ({ ...prev, open: true }));
  };

  const handleCloseSlackConfig = () => {
    setSlackConfigDialog(prev => ({ ...prev, open: false }));
  };

  const handleSlackConfigSuccess = (message = 'Slack configuration saved successfully!') => {
    setSuccess(message);
    // Refresh Slack integration status
    handleLoadSlackIntegration();
  };

  // Slack Integration Functions
  const handleLoadSlackIntegration = async () => {
    try {
      setSlackLoading(true);
      const response = await SlackIntegrationService.getSlackOAuthConfig(ENV.SLACK_OAUTH_NAME);
      
      if (response.data?.exists === true) {
        setSlackIntegration({
          connected: true,
          teamName: 'Configured',
          channelName: 'Configured',
          webhookUrl: 'Configured',
          connectedAt: 'Configured',
          connectedBy: 'Webhook',
          lastUsed: null,
        });
      } else {
        setSlackIntegration({
          connected: false,
          teamName: null,
          channelName: null,
          webhookUrl: null,
          connectedAt: null,
          lastUsed: null,
        });
      }
    } catch (error) {
      console.error('Error loading Slack integration:', error);
      setSlackIntegration({
        connected: false,
        teamName: null,
        channelName: null,
        webhookUrl: null,
        connectedAt: null,
        lastUsed: null,
      });
    } finally {
      setSlackLoading(false);
    }
  };

  const handleConnectSlack = () => {
    // Webhook-based setup: users should configure Slack webhook in settings dialog
    handleOpenSlackConfig();
  };

  const handleDisconnectSlack = async () => {
    try {
      setSlackLoading(true);
      const response = await SlackIntegrationService.disconnectSlack();
      
      if (response.status === 'success') {
        setSuccess('Slack integration disconnected successfully');
        setSlackIntegration({
          connected: false,
          teamName: null,
          channelName: null,
          webhookUrl: null,
          connectedAt: null,
          lastUsed: null,
        });
      } else {
        setError(response.error?.message || 'Failed to disconnect Slack integration');
      }
    } catch (error) {
      console.error('Error disconnecting Slack:', error);
      setError(error.response?.data?.error?.message || error.message || 'Failed to disconnect Slack integration');
    } finally {
      setSlackLoading(false);
    }
  };

  const handleTestSlackNotification = async () => {
    try {
      setSlackLoading(true);
      const response = await SlackIntegrationService.testSlackNotification();
      
      if (response.status === 'success') {
        setSuccess('Test notification sent to Slack successfully');
        // Refresh integration status to update lastUsed timestamp
        await handleLoadSlackIntegration();
      } else {
        setError(response.error?.message || 'Failed to send test notification');
      }
    } catch (error) {
      console.error('Error testing Slack notification:', error);
      setError(error.response?.data?.error?.message || error.message || 'Failed to send test notification');
    } finally {
      setSlackLoading(false);
    }
  };

  const handleTestSESConnectivity = async () => {
    try {
      const response = await HealthMonitorApiService.testSESConnectivity();
      if (response.status === 'success') {
        setSuccess('SES connectivity test successful! Check your email for the test message.');
      } else {
        setError(`SES connectivity test failed: ${response.data?.error?.message || 'Unknown error'}`);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to test SES connectivity');
    }
  };

  return {
    // Email State
    emailConfigDialog,
    emailConfig,
    newEmail,
    
    // Email Actions
    handleOpenEmailConfig,
    handleCloseEmailConfig,
    handleUpdateEmailConfig,
    handleRemoveEmail,
    handleAddEmail,
    setNewEmail,
    setEmailConfig,
    
    // Slack Configuration State
    slackConfigDialog,
    
    // Slack Configuration Actions
    handleOpenSlackConfig,
    handleCloseSlackConfig,
    handleSlackConfigSuccess,
    
    // Slack State
    slackIntegration,
    slackLoading,
    
    // Slack Actions
    handleLoadSlackIntegration,
    handleConnectSlack,
    handleDisconnectSlack,
    handleTestSlackNotification,
    
    // Test Actions
    handleTestSESConnectivity,
    
    // Setters
    setEmailConfigDialog,
    setSlackIntegration,
  };
};
