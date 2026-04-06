import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import {
  Info,
  CheckCircle,
  Loader2,
  Settings,
  MessageCircle,
} from 'lucide-react';
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Slack Webhook Configuration
            {checkingConfig ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : configExists ? (
              <Badge className="bg-green-100 text-green-800">Configured</Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-800">Not Configured</Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <form autoComplete="off" noValidate>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Setup Instructions:</p>
                  <ol className="text-sm text-blue-700 mt-2 space-y-1 list-decimal list-inside">
                    <li>Create a Slack App at <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="underline">https://api.slack.com/apps</a></li>
                    <li>Enable <strong>Incoming Webhooks</strong></li>
                    <li>Add a new webhook to your workspace and select the channel for alerts</li>
                    <li>Copy the generated <strong>Webhook URL</strong> and paste below</li>
                  </ol>
                </div>
              </div>
            </div>

            {configExists && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Slack Webhook is already configured! 🎉</p>
                    <ul className="text-sm text-green-700 mt-2 space-y-1 list-disc list-inside">
                      <li>Organization: <strong>{ENV.SLACK_OAUTH_NAME}</strong></li>
                      <li>Status: <strong>Ready to send notifications</strong></li>
                      <li>You can now send notifications to Slack channels</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {!configExists && (
              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Incoming Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  value={formData.webhookUrl}
                  onChange={handleInputChange('webhookUrl')}
                  disabled={configExists}
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  placeholder="https://hooks.slack.com/services/..."
                  name={`slack-webhook-url-${Date.now()}`}
                />
                {errors.webhookUrl && (
                  <p className="text-sm text-red-600">{errors.webhookUrl}</p>
                )}
                <p className="text-xs text-slate-500">
                  From your Slack App's Incoming Webhooks settings
                </p>
              </div>
            )}

            {configExists && (
              <div className="text-center py-8">
                <Settings className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-700 mb-2">
                  Slack Integration Ready
                </h3>
                <p className="text-sm text-slate-600">
                  Your Slack app is configured and ready to send notifications.
                </p>
              </div>
            )}

            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {errors.submit}
              </div>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {configExists ? 'Close' : 'Cancel'}
          </Button>
          {!configExists && (
            <Button 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SlackOAuthConfigDialog;
