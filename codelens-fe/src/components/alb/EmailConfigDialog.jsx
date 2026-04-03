import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Box,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
} from '@mui/icons-material';

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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon />
            <Typography variant="h6">Email Configuration</Typography>
          </Box>
          <IconButton onClick={onClose} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure email notifications for ALB health monitoring. Emails will be sent when unhealthy targets are detected.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* To Emails */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Recipient Emails
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {safeEmailConfig.toEmails?.map((email, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={email}
                    onDelete={() => onRemoveEmail(email)}
                    deleteIcon={<DeleteIcon />}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              ))}
              
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  size="small"
                  placeholder="Add email address"
                  value={newEmail}
                  onChange={onNewEmailChange}
                  disabled={loading}
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={onAddEmail}
                  disabled={!newEmail || loading}
                  startIcon={<AddIcon />}
                >
                  Add
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Email Notifications Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={safeEmailConfig.emailsEnabled}
                onChange={(e) => onConfigChange('emailsEnabled', e.target.checked)}
                disabled={loading}
              />
            }
            label="Enable Email Notifications"
          />

          {/* Check Interval */}
          <FormControl fullWidth>
            <InputLabel>Check Interval</InputLabel>
            <Select
              value={safeEmailConfig.interval}
              onChange={(e) => onConfigChange('interval', e.target.value)}
              disabled={loading}
            >
              <MenuItem value="1">Every 1 minute</MenuItem>
              <MenuItem value="5">Every 5 minutes</MenuItem>
              <MenuItem value="10">Every 10 minutes</MenuItem>
              <MenuItem value="15">Every 15 minutes</MenuItem>
              <MenuItem value="30">Every 30 minutes</MenuItem>
              <MenuItem value="60">Every 1 hour</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onSave}
          variant="contained"
          disabled={loading || !safeEmailConfig.toEmails || safeEmailConfig.toEmails.length === 0}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Saving...' : 'Save Configuration'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailConfigDialog;
