import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CircleMinus,
  Check,
} from 'lucide-react';
import TargetGroupCard from './TargetGroupCard';

const TableContainer = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

const Paper = ({ children }) => <>{children}</>;

const Table = ({ children }) => <table className="w-full text-sm">{children}</table>;
const TableHead = ({ children }) => <thead>{children}</thead>;
const TableBody = ({ children }) => <tbody>{children}</tbody>;
const TableRow = ({ children }) => <tr className="border-b align-top">{children}</tr>;
const TableCell = ({ children, colSpan, style }) => (
  <td className="p-2" colSpan={colSpan} style={style}>
    {children}
  </td>
);

const IconButton = ({ children, onClick, disabled = false, ...props }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted disabled:opacity-50"
    {...props}
  >
    {children}
  </button>
);

const Tooltip = ({ children, title }) => (
  <span title={typeof title === 'string' ? title : undefined}>{children}</span>
);

const Chip = ({ label, color = 'default', variant = 'outlined', icon }) => {
  const colorClasses = {
    default: 'border-slate-300 text-slate-700',
    warning: 'border-amber-300 text-amber-700',
    primary: 'border-blue-300 text-blue-700',
    success: 'border-emerald-300 text-emerald-700',
    error: 'border-rose-300 text-rose-700',
  };

  const baseColor = colorClasses[color] || colorClasses.default;
  const variantClass = variant === 'filled' ? 'bg-slate-100' : 'bg-transparent';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${baseColor} ${variantClass}`}>
      {icon}
      {label}
    </span>
  );
};

const Collapse = ({ in: open, children }) => (open ? <div>{children}</div> : null);

const Box = ({ children }) => <div className="p-2">{children}</div>;

const Typography = ({ children, className = '' }) => (
  <p className={`text-sm ${className}`.trim()}>{children}</p>
);

const KeyboardArrowUp = () => <ChevronUp className="h-4 w-4" />;
const KeyboardArrowDown = () => <ChevronDown className="h-4 w-4" />;
const UnusedIcon = () => <CircleMinus className="h-3 w-3" />;
const InUseIcon = () => <Check className="h-3 w-3" />;

const AlbTable = ({
  albs,
  expandedAlbRows,
  onToggleAlbRow,
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
  onTerminateSingleInstance,
}) => {
  // Calculate total healthy and unhealthy counts across all ALBs
  const calculateTotalCounts = () => {
    let totalHealthy = 0;
    let totalUnhealthy = 0;
    
    console.log('🔍 DEBUG: AlbTable - albs data:', albs);
    
    albs.forEach((alb, albIndex) => {
      console.log(`🔍 DEBUG: Processing ALB ${albIndex}:`, alb.albName);
      
      alb.targetGroups?.forEach((tg, tgIndex) => {
        const tgHealthEntry = alb.targetGroupHealth?.find(tgh => tgh.targetGroupArn === tg.targetGroupArn);
        const targets = tgHealthEntry?.targets || [];
        
        const tgHealthy = targets.filter(t => t?.health === 'healthy').length;
        const tgUnhealthy = targets.filter(t => t?.health === 'unhealthy').length;
        
        console.log(`🔍 DEBUG: TG ${tgIndex} - ${tg.targetGroupName}:`, {
          healthy: tgHealthy,
          unhealthy: tgUnhealthy,
          totalTargets: targets.length
        });
        
        totalHealthy += tgHealthy;
        totalUnhealthy += tgUnhealthy;
      });
    });
    
    console.log(`🔍 DEBUG: Final totals - Healthy: ${totalHealthy}, Unhealthy: ${totalUnhealthy}`);
    
    return { totalHealthy, totalUnhealthy };
  };
  
  const { totalHealthy, totalUnhealthy } = calculateTotalCounts();
  const renderHealthStatusIcon = (health, targetType) => {
    const iconMap = {
      healthy: { color: 'success', label: 'healthy' },
      unhealthy: { color: 'error', label: 'unhealthy' },
      unused: { color: 'warning', label: 'unused' },
      unknown: { color: 'default', label: 'unknown' }
    };
    
    const status = iconMap[health] || iconMap.unknown;
    return (
      <Chip
        size="small"
        label={health}
        color={status.color}
        variant={health === 'unhealthy' ? 'filled' : 'outlined'}
      />
    );
  };

  return (
    <TableContainer component={Paper} sx={{ mb: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 48 }} />
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Region</TableCell>
            <TableCell>State</TableCell>
            <TableCell>Scheme</TableCell>
            <TableCell>Target Groups</TableCell>
            <TableCell>Healthy</TableCell>
            <TableCell>Unhealthy</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {albs.map((alb, index) => {
            const tgHealth = Array.isArray(alb?.targetGroupHealth) ? alb.targetGroupHealth : [];
            const albKey = alb.loadBalancerArn || `${alb.loadBalancerName}-${index}`;
            const isExpanded = Boolean(expandedAlbRows[albKey]);

            const unhealthyCount = tgHealth.reduce((acc, h) => {
              const targets = Array.isArray(h?.targets) ? h.targets : [];
              return acc + targets.filter((t) => t?.health === 'unhealthy').length;
            }, 0);

            const healthyCount = tgHealth.reduce((acc, h) => {
              const targets = Array.isArray(h?.targets) ? h.targets : [];
              return acc + targets.filter((t) => t?.health === 'healthy').length;
            }, 0);

            const totalRegisteredTargets = tgHealth.reduce((acc, h) => {
              const targets = Array.isArray(h?.targets) ? h.targets : [];
              return acc + targets.length;
            }, 0);

            const targetGroups = Array.isArray(alb?.targetGroups) ? alb.targetGroups : [];

            return (
              <React.Fragment key={albKey}>
                <TableRow hover>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => onToggleAlbRow(albKey)}
                      aria-label={isExpanded ? 'collapse' : 'expand'}
                    >
                      {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                    </IconButton>
                  </TableCell>
                  <TableCell>{alb.loadBalancerName}</TableCell>
                  <TableCell>{alb.type}</TableCell>
                  <TableCell>{alb.region}</TableCell>
                  <TableCell>{alb.state}</TableCell>
                  <TableCell>{alb.scheme}</TableCell>
                  <TableCell>
                    {targetGroups.length === 0 ? (
                      <Tooltip title="No target groups - unused">
                        <Chip
                          size="small"
                          icon={<UnusedIcon />}
                          label="unused"
                          color="warning"
                          variant="outlined"
                        />
                      </Tooltip>
                    ) : (
                      <Chip
                        size="small"
                        label={targetGroups.length}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Healthy targets">
                      <Chip
                        size="small"
                        label={healthyCount}
                        color="success"
                        variant={healthyCount > 0 ? 'filled' : 'outlined'}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Unhealthy targets">
                      <Chip
                        size="small"
                        label={unhealthyCount}
                        color="error"
                        variant={unhealthyCount > 0 ? 'filled' : 'outlined'}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {targetGroups.length === 0 || totalRegisteredTargets === 0 ? (
                      <Tooltip title="No registered targets - unused">
                        <Chip
                          size="small"
                          icon={<UnusedIcon />}
                          label="unused"
                          color="warning"
                          variant="outlined"
                        />
                      </Tooltip>
                    ) : (
                      <Tooltip title="Load balancer is in use">
                        <Chip
                          size="small"
                          icon={<InUseIcon />}
                          label="in use"
                          color="success"
                          variant="outlined"
                        />
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Target Groups ({targetGroups.length})
                        </Typography>

                        {targetGroups.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            No target groups found.
                          </Typography>
                        ) : (
                          targetGroups.map((tg) => {
                            const tgArn = tg?.targetGroupArn || tg?.TargetGroupArn;
                            const tgName = tg?.targetGroupName || tg?.TargetGroupName || 'Unknown';

                            const tgHealthEntry = tgHealth.find((h) => h?.targetGroupArn === tgArn);
                            const targets = Array.isArray(tgHealthEntry?.targets) ? tgHealthEntry.targets : [];
                            const unhealthy = targets.filter((t) => t?.health === 'unhealthy').length;
                            const healthy = targets.filter((t) => t?.health === 'healthy').length;

                            return (
                              <TargetGroupCard
                                key={tgArn || tgName}
                                targetGroup={tg}
                                tgArn={tgArn}
                                tgName={tgName}
                                healthy={healthy}
                                unhealthy={unhealthy}
                                targets={targets}
                                alb={alb}
                                totalHealthy={totalHealthy} // Pass total healthy count across all ALBs
                                totalUnhealthy={totalUnhealthy} // Pass total unhealthy count across all ALBs
                                onShowUnhealthyDetails={onShowUnhealthyDetails}
                                selectedTargets={selectedTargets}
                                onToggleTargetSelection={onToggleTargetSelection}
                                excludedTargets={excludedTargets}
                                onRemoveExclusion={onRemoveExclusion}
                                onSelectAllInGroup={onSelectAllInGroup}
                                onDeselectAllInGroup={onDeselectAllInGroup}
                                isTargetSelected={isTargetSelected}
                                isTargetExcluded={isTargetExcluded}
                                autoDeregisterEnabled={autoDeregisterEnabled}
                                onDeregisterSingleTarget={onDeregisterSingleTarget}
                                onTerminateSingleInstance={onTerminateSingleInstance}
                              />
                            );
                          })
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AlbTable;
