import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Tooltip,
  Divider,
  Checkbox,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';
import {
  RemoveCircle,
  Delete as DeleteIcon,
  BugReport as BugReportIcon,
  Shield as ShieldIcon,
  ShieldOutlined as ShieldOutlinedIcon,
} from '@mui/icons-material';

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
      healthy: 'success',
      unhealthy: 'error',
      unused: 'warning',
      unknown: 'default'
    };
    
    const color = colorMap[health] || 'default';
    return (
      <Chip
        size="small"
        label={health}
        color={color}
        variant={health === 'unhealthy' ? 'filled' : 'outlined'}
      />
    );
  };

  return (
    <Card sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ py: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {tgName}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip size="small" label={`${healthy} healthy`} color="success" variant="outlined" />
            <Chip size="small" label={`${unhealthy} unhealthy`} color={unhealthy > 0 ? 'error' : 'default'} variant={unhealthy > 0 ? 'filled' : 'outlined'} />
            {unhealthy > 0 && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<BugReportIcon />}
                onClick={() => onShowUnhealthyDetails(tgArn, tgName, alb.region)}
              >
                View Issues
              </Button>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Enhanced Bulk Actions */}
        {targets.length > 0 && (
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2" color="text.secondary">
              Selection Actions:
            </Typography>
            
            {/* Select All/Deselect All */}
            <Button
              variant="outlined"
              size="small"
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
                variant="outlined"
                color="warning"
                size="small"
                onClick={() => {
                  const unhealthyTargets = targets.filter(t => t.health === 'unhealthy');
                  onSelectAllInGroup(unhealthyTargets, tgArn, tgName);
                }}
              >
                Select Unhealthy ({unhealthy})
              </Button>
            )}
          </Box>
        )}

        {/* Excluded Targets Alert */}
        {excludedTargets.some(t => t.targetGroupArn === tgArn) && (
          <Alert 
            severity="success" 
            sx={{ mb: 2 }}
            action={
              <Button
                size="small"
                color="inherit"
                onClick={() => {
                  const groupExcludedTargets = excludedTargets.filter(t => t.targetGroupArn === tgArn);
                  groupExcludedTargets.forEach(target => {
                    onRemoveExclusion(target.targetId, target.port);
                  });
                }}
              >
                Clear All
              </Button>
            }
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShieldIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2">
                <strong>{excludedTargets.filter(t => t.targetGroupArn === tgArn).length}</strong> target(s) in this group are protected from auto-deletion
              </Typography>
            </Box>
          </Alert>
        )}

        {targets.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No targets registered.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      (() => {
                        const selectedInGroup = targets.filter(t => 
                          isTargetSelected(t.targetId || t.id, t.port, tgArn)
                        ).length;
                        return selectedInGroup > 0 && selectedInGroup < targets.length;
                      })()
                    }
                    checked={targets.every(t => 
                      isTargetSelected(t.targetId || t.id, t.port, tgArn)
                    )}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectAllInGroup(targets, tgArn, tgName);
                      } else {
                        onDeselectAllInGroup(tgArn);
                      }
                    }}
                  />
                </TableCell>
                <TableCell>Target Instance (Name/ID)</TableCell>
                <TableCell>Port</TableCell>
                <TableCell>Health</TableCell>
                <TableCell>Protection Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {targets.map((t, ti) => {
                const targetId = t?.targetId || t?.id;
                const port = t?.port;
                const healthState = t?.health || 'unknown';
                const isSelected = isTargetSelected(targetId, port, tgArn);
                const isExcluded = isTargetExcluded(targetId, port, tgArn);
                const isProtected = isSelected || isExcluded;
                
                return (
                  <TableRow key={`${targetId}-${port}-${ti}`} hover>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => onToggleTargetSelection({
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
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {t?.targetName || targetId}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {targetId}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{port}</TableCell>
                    <TableCell>
                      {renderHealthStatusIcon(healthState)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isProtected ? (
                          <>
                            <ShieldIcon color="success" sx={{ fontSize: 16 }} />
                            <Typography variant="body2" color="success.main" sx={{ fontSize: 12 }}>
                              Protected
                            </Typography>
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                            Not Protected
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell align="right">
                      {!autoDeregisterEnabled && healthState === 'unhealthy' ? (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Tooltip
                            title={
                              isProtected
                                ? 'Protected targets cannot be deregistered'
                                : 'Deregister this target from the target group'
                            }
                          >
                            <span>
                              <Button
                                size="small"
                                variant="contained"
                                color="warning"
                                disabled={isProtected}
                                onClick={() =>
                                  onDeregisterSingleTarget?.({
                                    targetGroupArn: tgArn,
                                    targetId,
                                    port,
                                    isProtected,
                                  })
                                }
                              >
                                Deregister
                              </Button>
                            </span>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Box />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default TargetGroupCard;
