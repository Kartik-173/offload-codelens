import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import SlackIntegrationService from '../../services/SlackIntegrationService';
import { ENV } from '../../config/env';

const SlackOAuthConfigDialog = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(false);
  const [configExists, setConfigExists] = useState(false);
  const [formData, setFormData] = useState({
    organization: ENV.SLACK_OAUTH_NAME,
    webhookUrl: '',
  });
  const [errors, setErrors] = useState({});

  // Check if OAuth config already exists
  useEffect(() => {
    if (open) {
      checkSlackConfig();
    }
  }, [open]);

  const checkSlackConfig = async () => {
    try {
      setCheckingConfig(true);
      const organization = ENV.SLACK_OAUTH_NAME;
      const response = await SlackIntegrationService.getSlackOAuthConfig(organization);
      console.log('Slack config check response:', response);
      
      // APIService.get() returns response.data directly, so response is the actual data
      const exists = response?.exists === true;
      console.log('Config exists:', exists);
      setConfigExists(exists);
    } catch (error) {
      console.error('Failed to check Slack config:', error);
      setConfigExists(false);
    } finally {
      setCheckingConfig(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.webhookUrl.trim()) {
      newErrors.webhookUrl = 'Webhook URL is required';
    } else if (!isValidUrl(formData.webhookUrl)) {
      newErrors.webhookUrl = 'Please enter a valid URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const configData = {
        organization: ENV.SLACK_OAUTH_NAME,
        webhookUrl: formData.webhookUrl.trim(),
      };

      console.log('ENV.SLACK_OAUTH_NAME:', ENV.SLACK_OAUTH_NAME);
      console.log('formData.organization:', formData.organization);
      console.log('Submitting Slack OAuth config:', configData);
      const response = await SlackIntegrationService.storeSlackOAuthConfig(configData);
      console.log('Slack config save response:', response);
      
      if (response.data?.success === true || response.success === true) {
        // Clear form data
        setFormData({
          organization: ENV.SLACK_OAUTH_NAME,
          webhookUrl: '',
        });
        setErrors({});
        
        // Update state
        setConfigExists(true);
        
        // Show success message
        onSuccess && onSuccess('Slack webhook configuration saved successfully!');
        onClose();
      } else {
        setErrors({ submit: response.error?.message || response.data?.error?.message || 'Failed to save configuration' });
      }
    } catch (error) {
      console.error('Failed to save Slack config:', error);
      setErrors({ submit: error.response?.data?.error?.message || error.message || 'Failed to save configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    setFormData({
      organization: ENV.SLACK_OAUTH_NAME,
      webhookUrl: '',
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">Slack Webhook Configuration</Typography>
          {checkingConfig ? (
            <CircularProgress size={20} />
          ) : configExists ? (
            <Chip 
              icon={<CheckCircleIcon />} 
              label="Configured" 
              color="success" 
              size="small" 
            />
          ) : (
            <Chip 
              icon={<ErrorIcon />} 
              label="Not Configured" 
              color="warning" 
              size="small" 
            />
          )}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <form autoComplete="off" noValidate>
          <Box sx={{ mb: 3 }}>
            <Alert severity="info" icon={<InfoIcon />}>
              <Typography variant="body2" component="div">
                <strong>Setup Instructions:</strong>
                <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>Create a Slack App at <a href="https://api.slack.com/apps" target="_blank" rel="noopener">https://api.slack.com/apps</a></li>
                  <li>Enable <strong>Incoming Webhooks</strong></li>
                  <li>Add a new webhook to your workspace and select the channel for alerts</li>
                  <li>Copy the generated <strong>Webhook URL</strong> and paste below</li>
                </ol>
              </Typography>
            </Alert>
          </Box>

          {configExists && (
          <Box sx={{ mb: 3 }}>
            <Alert severity="success" icon={<CheckCircleIcon />}>
              <Typography variant="body2" component="div">
                <strong>Slack Webhook is already configured! 🎉</strong>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>Organization: <strong>{ENV.SLACK_OAUTH_NAME}</strong></li>
                  <li>Status: <strong>Ready to send notifications</strong></li>
                  <li>You can now send notifications to Slack channels</li>
                </ul>
              </Typography>
            </Alert>
          </Box>
        )}

          {!configExists && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Incoming Webhook URL"
              value={formData.webhookUrl}
              onChange={handleInputChange('webhookUrl')}
              error={!!errors.webhookUrl}
              helperText={errors.webhookUrl || "From your Slack App's Incoming Webhooks settings"}
              fullWidth
              disabled={configExists}
              type="text"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              inputProps={{ 
                autoComplete: 'new-password', 
                autoFill: 'off',
                form: { autoComplete: 'off' }
              }}
              name={`slack-webhook-url-${Date.now()}`}
            />
          </Box>
        )}

        {configExists && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <SettingsIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" color="success.main" gutterBottom>
              Slack Integration Ready
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your Slack app is configured and ready to send notifications.
            </Typography>
          </Box>
        )}

          {errors.submit && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="error">{errors.submit}</Alert>
            </Box>
          )}
        </form>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} disabled={loading}>
          {configExists ? 'Close' : 'Cancel'}
        </Button>
        {!configExists && (
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
            start={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SlackOAuthConfigDialog;
