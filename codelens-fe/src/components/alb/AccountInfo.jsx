import React, { useState, useEffect } from 'react';
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
import {
  RefreshCw,
  Mail,
  Info,
  Shield,
  Loader2,
} from 'lucide-react';
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
    <Card className="mb-6">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">
          AWS Account Information
        </h2>
        <p className="text-sm text-slate-600 mb-4">
          Select a region to fetch load balancers from that specific AWS region
        </p>
        {lastFetchTime && (
          <p className="text-xs text-slate-500 mb-2">
            Last fetched: {lastFetchTime.toLocaleString()}
          </p>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mb-4">
          <div className="md:col-span-3">
            {accountIds.length > 1 ? (
              <div className="w-full">
                <label className="block text-sm font-medium mb-1">Select Account</label>
                <select
                  className="w-full p-2 border rounded text-sm"
                  value={selectedAccountId}
                  onChange={(e) => onAccountChange(e.target.value)}
                >
                  {accountIds.map((accountId) => (
                    <option key={accountId} value={accountId}>
                      {accountIdToName?.[accountId]
                        ? `${accountId}-${accountIdToName[accountId]}`
                        : accountId}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-sm text-slate-600">
                Account ID: {accountIdToName?.[storedCredentials.accountId]
                  ? `${storedCredentials.accountId}-${accountIdToName[storedCredentials.accountId]}`
                  : storedCredentials.accountId}
              </p>
            )}
          </div>
          
          <div className="md:col-span-9">
            <RegionSelector
              selectedRegions={selectedRegions}
              onRegionsChange={onRegionsChange}
              onClearRegions={onClearRegions}
              onSelectAllRegions={onSelectAllRegions}
              loading={loading}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 items-center">
          <div className="flex flex-wrap gap-3 items-center">
            <Button
              onClick={onFetchAlbs}
              disabled={loading || selectedRegions.length === 0}
              className="min-w-[140px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Fetching...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Fetch Load Balancers
                </>
              )}
            </Button>
            
            <button
              className="p-2 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
              title="Configure email notifications"
              onClick={onOpenEmailConfig}
              disabled={loading}
            >
              <Mail className="h-5 w-5" />
            </button>
            
            <button
              className="p-2 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
              title="Configure Slack notifications"
              onClick={onOpenSlackConfig}
              disabled={loading}
            >
              <img 
                src="/slack-icon.png"
                alt="Slack" 
                className="w-5 h-5"
              />
            </button>
            
            <div className="flex items-center gap-2 ml-2">
              <Switch
                checked={uiAutoDeregisterEnabled}
                onCheckedChange={(checked) => {
                  console.log('Auto Deregister toggled to:', checked);
                  setUiAutoDeregisterEnabled(checked);
                  onAutoDeregisterToggle({ target: { checked } });
                }}
              />
              <Label className="text-sm">Auto Deregister</Label>
            </div>
          </div>
          
          {/* Target Protection Notice */}
          <div className="mt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <p className="text-sm text-slate-700">
                Protected targets will not be automatically removed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AccountInfo;
