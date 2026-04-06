import React from 'react';
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
import { Switch } from "../../components/ui/switch";
import { Badge } from "../../components/ui/badge";
import {
  X,
  Plus,
  Trash2,
  Mail,
  Loader2,
} from 'lucide-react';

const EmailConfigDialog = ({
  open,
  loading,
  emailConfig,
  newEmail,
  onClose,
  onSave,
  onAddEmail,
  onRemoveEmail,
  onNewEmailChange,
  onConfigChange,
}) => {
  // Ensure emailConfig has default values to prevent undefined errors
  const safeEmailConfig = {
    fromEmail: 'team@cloudsanalytics.ai',
    toEmails: [],
    emailsEnabled: false,
    interval: '5',
    ...emailConfig
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Configuration
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-600">
            Configure email notifications for ALB health monitoring. Emails will be sent when unhealthy targets are detected.
          </p>

          {/* To Emails */}
          <div className="space-y-2">
            <Label>Recipient Emails</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {safeEmailConfig.toEmails?.map((email, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {email}
                  <button
                    onClick={() => onRemoveEmail(email)}
                    disabled={loading}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add email address"
                value={newEmail}
                onChange={onNewEmailChange}
                disabled={loading}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={onAddEmail}
                disabled={!newEmail || loading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Email Notifications Toggle */}
          <div className="flex items-center gap-2">
            <Switch
              checked={safeEmailConfig.emailsEnabled}
              onCheckedChange={(checked) => onConfigChange('emailsEnabled', checked)}
              disabled={loading}
            />
            <Label>Enable Email Notifications</Label>
          </div>

          {/* Check Interval */}
          <div className="space-y-2">
            <Label>Check Interval</Label>
            <select
              className="w-full p-2 border rounded"
              value={safeEmailConfig.interval}
              onChange={(e) => onConfigChange('interval', e.target.value)}
              disabled={loading}
            >
              <option value="1">Every 1 minute</option>
              <option value="5">Every 5 minutes</option>
              <option value="10">Every 10 minutes</option>
              <option value="15">Every 15 minutes</option>
              <option value="30">Every 30 minutes</option>
              <option value="60">Every 1 hour</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={loading || !safeEmailConfig.toEmails || safeEmailConfig.toEmails.length === 0}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailConfigDialog;
