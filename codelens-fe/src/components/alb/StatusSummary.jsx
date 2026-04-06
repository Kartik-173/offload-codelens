import React from 'react';
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Bug,
  HeartPulse,
  Mail,
  Play,
  Shield,
  MessageCircle,
} from 'lucide-react';
import { getTargetGroupHealthSummary, getUnhealthyTargetsCount } from '../../utils/Helpers';

const StatusSummary = ({ 
  albs, 
  targetGroups, 
  onConfigureEmail, 
  onConfigureSlack,
  onViewUnhealthyDetails,
  selectedCount,
  excludedCount,
  onSelectAllUnhealthy,
  onClearSelections,
  onAutoDeregister,
  onManualDeregister,
  autoDeregisterEnabled,
  monitoringAutoDeregister,
  lastAutoDeregisterActivity,
  slackIntegration
}) => {
  const healthSummary = getTargetGroupHealthSummary(targetGroups);
  const unhealthyCount = getUnhealthyTargetsCount(targetGroups, albs);

  return (
    <Card className="mb-6">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Load Balancers Summary</h2>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-800">{albs.length}</p>
            <p className="text-sm text-slate-600">Total ALBs</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{albs.filter(alb => alb.state === 'active').length}</p>
            <p className="text-sm text-slate-600">Active ALBs</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{new Set(albs.map(alb => alb.region)).size}</p>
            <p className="text-sm text-slate-600">Regions with ALBs</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-amber-600">{Object.keys(targetGroups).length}</p>
            <p className="text-sm text-slate-600">Target Groups</p>
          </div>
        </div>
        
        {/* Target Health Summary */}
        {Object.keys(targetGroups).length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-200">
            <h3 className="text-lg font-medium mb-3">Target Health Summary</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-semibold text-slate-800">{healthSummary.totalTargets}</p>
                <p className="text-xs text-slate-600">Total Targets</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-red-600">{unhealthyCount}</p>
                <p className="text-xs text-slate-600">Unhealthy</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-green-600">{healthSummary.healthyTargets}</p>
                <p className="text-xs text-slate-600">Healthy</p>
              </div>
            </div>
            
            {/* Auto-Deregister Monitoring Status */}
            {autoDeregisterEnabled && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Auto-Deregister Monitor</span>
                  {monitoringAutoDeregister && (
                    <Badge className="bg-green-100 text-green-800 text-xs">Active</Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600">
                  {monitoringAutoDeregister 
                    ? "Monitoring for auto-deregister activity... UI will refresh automatically when targets are deregistered."
                    : "Monitor not active - refresh page to see latest auto-deregister results."
                  }
                </p>
                {lastAutoDeregisterActivity?.lastRunAt && (
                  <p className="text-xs text-slate-500 mt-2">
                    Last activity: {new Date(lastAutoDeregisterActivity.lastRunAt).toLocaleString()}
                    {lastAutoDeregisterActivity.totalDeregistered > 0 && 
                      ` • ${lastAutoDeregisterActivity.totalDeregistered} targets deregistered`
                    }
                  </p>
                )}
              </div>
            )}

            {/* Unhealthy Instances Quick Actions */}
            {!autoDeregisterEnabled && unhealthyCount > 0 && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <Bug className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-800">
                    ⚠️ {unhealthyCount} Unhealthy Instance{unhealthyCount > 1 ? 's' : ''} Detected
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  Some instances are experiencing health issues. Click below to view detailed information and take action.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onViewUnhealthyDetails}
                  >
                    <HeartPulse className="h-4 w-4 mr-1" />
                    View Unhealthy Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onConfigureEmail}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Configure Email Alerts
                  </Button>
                </div>
              </div>
            )}

            {/* Email Configuration Button (always visible) */}
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                onClick={onConfigureEmail}
              >
                <Mail className="h-4 w-4" />
                Email Settings
              </button>
              <button
                className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                onClick={onConfigureSlack}
              >
                <MessageCircle className="h-4 w-4" />
                Slack Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatusSummary;
