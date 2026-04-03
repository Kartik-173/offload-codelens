import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Button,
  Tooltip,
  CircularProgress,
  Switch,
  FormControlLabel,
  IconButton,
  Avatar,
} from '@mui/material';
import { Alert } from '@mui/material';

// Import Alert component for target protection notice
import {
  Refresh,
  Email as EmailIcon,
  Info as InfoIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import RegionSelector from './RegionSelector';

const AccountInfo = ({
  storedCredentials,
  accountIds,
  accountIdToName,
  selectedAccountId,
  selectedRegions,
  loading,
  lastFetchTime,
  autoDeregisterEnabled,
  onAccountChange,
  onRegionsChange,
  onClearRegions,
  onSelectAllRegions,
  onFetchAlbs,
  onOpenEmailConfig,
  onOpenSlackConfig,
  onAutoDeregisterToggle,
  onSaveAccountSettings,
}) => {
  // Local state for UI-only toggles
  const [uiAutoDeregisterEnabled, setUiAutoDeregisterEnabled] = useState(autoDeregisterEnabled);

  // Sync local state with props when they change
  useEffect(() => {
    console.log('🔄 AccountInfo: Syncing local state with props:', {
      autoDeregisterEnabled
    });
    setUiAutoDeregisterEnabled(autoDeregisterEnabled);
  }, [autoDeregisterEnabled]);
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          AWS Account Information
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Select a region to fetch load balancers from that specific AWS region
        </Typography>
        {lastFetchTime && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
            Last fetched: {lastFetchTime.toLocaleString()}
          </Typography>
        )}
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            {accountIds.length > 1 ? (
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Select Account</InputLabel>
                <Select
                  value={selectedAccountId}
                  label="Select Account"
                  onChange={(e) => onAccountChange(e.target.value)}
                >
                  {accountIds.map((accountId) => (
                    <MenuItem key={accountId} value={accountId}>
                      {accountIdToName?.[accountId]
                        ? `${accountId}-${accountIdToName[accountId]}`
                        : accountId}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Account ID: {accountIdToName?.[storedCredentials.accountId]
                  ? `${storedCredentials.accountId}-${accountIdToName[storedCredentials.accountId]}`
                  : storedCredentials.accountId}
              </Typography>
            )}
          </Grid>
          
          <Grid item xs={12} md={9}>
            <RegionSelector
              selectedRegions={selectedRegions}
              onRegionsChange={onRegionsChange}
              onClearRegions={onClearRegions}
              onSelectAllRegions={onSelectAllRegions}
              loading={loading}
            />
          </Grid>
        </Grid>
        
        <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Tooltip title={selectedRegions.length > 0 ? `Fetch load balancers from ${selectedRegions.length} region(s)` : "Please select at least one region first"}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
                  onClick={onFetchAlbs}
                  disabled={loading || selectedRegions.length === 0}
                  sx={{ minWidth: 140 }}
                >
                  {loading ? 'Fetching...' : 'Fetch Load Balancers'}
                </Button>
              </Tooltip>
              
              <Tooltip title="Configure email notifications">
                <IconButton
                  color="primary"
                  onClick={onOpenEmailConfig}
                  disabled={loading}
                  size="small"
                >
                  <EmailIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Configure Slack notifications">
                <IconButton
                  color="primary"
                  onClick={onOpenSlackConfig}
                  disabled={loading}
                  size="small"
                >
                  <img 
                    src="/slack-icon.png"
                    alt="Slack" 
                    style={{ width: 20, height: 20 }}
                  />
                </IconButton>
              </Tooltip>
              
              <FormControlLabel
                sx={{ ml: 1 }}
                control={
                  <Switch
                      checked={uiAutoDeregisterEnabled}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        console.log('Auto Deregister toggled to:', newValue);
                        setUiAutoDeregisterEnabled(newValue);
                        // Call the backend API
                        onAutoDeregisterToggle(e);
                      }}
                      color="error"
                    />
                }
                label="Auto Deregister"
              />
            </Box>
          </Grid>
          
          {/* Target Protection Notice */}
          <Grid item xs={12}>
            <Alert 
              severity="info" 
              icon={<ShieldIcon />}
              sx={{ mt: 2 }}
            >
              <Typography variant="body2">
                Protected targets will not be automatically removed.
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default AccountInfo;
