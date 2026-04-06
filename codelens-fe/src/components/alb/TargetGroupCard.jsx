import React from 'react';
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Checkbox } from "../../components/ui/checkbox";
import { Switch } from "../../components/ui/switch";
import { Label } from "../../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  RemoveCircle,
  Trash2,
  Bug,
  Shield,
  ShieldOff,
} from 'lucide-react';

const TargetGroupCard = ({
  targetGroup,
  tgArn,
  tgName,
  healthy,
  unhealthy,
  targets,
  alb,
  totalHealthy,
  totalUnhealthy,
  onShowUnhealthyDetails,
  selectedTargets,
  onToggleTargetSelection,
  excludedTargets,
  onRemoveExclusion,
  onSelectAllInGroup,
  onDeselectAllInGroup,
  isTargetSelected,
  isTargetExcluded,
  autoDeregisterEnabled,
  onDeregisterSingleTarget,
}) => {
  console.log('🔍 DEBUG: TargetGroupCard - totalHealthy:', totalHealthy, 'totalUnhealthy:', totalUnhealthy);
  
  const renderHealthStatusIcon = (health) => {
    const colorMap = {
      healthy: 'bg-green-100 text-green-800',
      unhealthy: 'bg-red-100 text-red-800',
      unused: 'bg-amber-100 text-amber-800',
      unknown: 'bg-gray-100 text-gray-800'
    };
    
    const colorClass = colorMap[health] || 'bg-gray-100 text-gray-800';
    return (
      <Badge className={colorClass}>
        {health}
      </Badge>
    );
  };

  return (
    <Card className="mb-4 border border-slate-200">
      <div className="p-4">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
          <h3 className="font-semibold">{tgName}</h3>
          <div className="flex gap-2 items-center flex-wrap">
            <Badge variant="outline" className="bg-green-50 text-green-700">{healthy} healthy</Badge>
            <Badge variant={unhealthy > 0 ? "destructive" : "outline"} className={unhealthy > 0 ? "" : "bg-gray-50 text-gray-700"}>
              {unhealthy} unhealthy
            </Badge>
            {unhealthy > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => onShowUnhealthyDetails(tgArn, tgName, alb.region)}
              >
                <Bug className="h-4 w-4 mr-1" />
                View Issues
              </Button>
            )}
          </div>
        </div>

        <div className="border-t border-slate-200 my-3" />

        {/* Enhanced Bulk Actions */}
        {targets.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-600">Selection Actions:</span>
            
            {/* Select All/Deselect All */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const allSelected = targets.every(t => 
                  isTargetSelected(t.targetId || t.id, t.port, tgArn)
                );
                if (allSelected) {
                  onDeselectAllInGroup(tgArn);
                } else {
                  onSelectAllInGroup(targets, tgArn, tgName);
                }
              }}
            >
              {targets.every(t => isTargetSelected(t.targetId || t.id, t.port, tgArn)) ? 'Deselect All' : 'Select All'}
            </Button>

            {/* Select All Unhealthy */}
            {unhealthy > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-amber-600 border-amber-300 hover:bg-amber-50"
                onClick={() => {
                  const unhealthyTargets = targets.filter(t => t.health === 'unhealthy');
                  onSelectAllInGroup(unhealthyTargets, tgArn, tgName);
                }}
              >
                Select Unhealthy ({unhealthy})
              </Button>
            )}
          </div>
        )}

        {/* Excluded Targets Alert */}
        {excludedTargets.some(t => t.targetGroupArn === tgArn) && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
            <Shield className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-800">
                <strong>{excludedTargets.filter(t => t.targetGroupArn === tgArn).length}</strong> target(s) in this group are protected from auto-deletion
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const groupExcludedTargets = excludedTargets.filter(t => t.targetGroupArn === tgArn);
                groupExcludedTargets.forEach(target => {
                  onRemoveExclusion(target.targetId, target.port);
                });
              }}
            >
              Clear All
            </Button>
          </div>
        )}

        {targets.length === 0 ? (
          <p className="text-sm text-slate-500">No targets registered.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={targets.every(t => isTargetSelected(t.targetId || t.id, t.port, tgArn))}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onSelectAllInGroup(targets, tgArn, tgName);
                      } else {
                        onDeselectAllInGroup(tgArn);
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Target Instance (Name/ID)</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Protection Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {targets.map((t, ti) => {
                const targetId = t?.targetId || t?.id;
                const port = t?.port;
                const healthState = t?.health || 'unknown';
                const isSelected = isTargetSelected(targetId, port, tgArn);
                const isExcluded = isTargetExcluded(targetId, port, tgArn);
                const isProtected = isSelected || isExcluded;
                
                return (
                  <TableRow key={`${targetId}-${port}-${ti}`}>
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleTargetSelection({
                          ...t,
                          targetId,
                          port,
                          targetGroupArn: tgArn,
                          targetGroupName: tgName,
                          albName: alb.loadBalancerName,
                          region: alb.region
                        })}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{t?.targetName || targetId}</p>
                        <p className="text-xs text-slate-500">{targetId}</p>
                      </div>
                    </TableCell>
                    <TableCell>{port}</TableCell>
                    <TableCell>
                      {renderHealthStatusIcon(healthState)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {isProtected ? (
                          <>
                            <Shield className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-700">Protected</span>
                          </>
                        ) : (
                          <span className="text-sm text-slate-500">Not Protected</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      {!autoDeregisterEnabled && healthState === 'unhealthy' ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={isProtected}
                            onClick={() =>
                              onDeregisterSingleTarget?.({
                                targetGroupArn: tgArn,
                                targetId,
                                port,
                                isProtected,
                              })
                            }
                            title={isProtected ? 'Protected targets cannot be deregistered' : 'Deregister this target'}
                          >
                            Deregister
                          </Button>
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </Card>
  );
};

export default TargetGroupCard;
