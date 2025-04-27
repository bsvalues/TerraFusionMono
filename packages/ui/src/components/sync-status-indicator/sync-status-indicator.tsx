import * as React from 'react';
import { cn } from '../../utils';
import { 
  Wifi, 
  WifiOff,
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Clock,
  ArrowDownUp,
  Ban
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '../tooltip';
import { Badge } from '../badge';

export type SyncStatus = 
  | 'synced'
  | 'syncing'
  | 'error'
  | 'offline'
  | 'pending'
  | 'disabled';

export interface SyncStatusIndicatorProps {
  /**
   * Current sync status
   */
  status: SyncStatus;
  /**
   * Last sync timestamp
   */
  lastSynced?: Date | null;
  /**
   * Number of pending changes
   */
  pendingChanges?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to show a badge with detailed info
   */
  showBadge?: boolean;
  /**
   * Whether to show a tooltip with detailed info
   */
  showTooltip?: boolean;
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Status indicator for mobile data synchronization
 */
export const SyncStatusIndicator = ({
  status,
  lastSynced = null,
  pendingChanges = 0,
  className = '',
  showBadge = false,
  showTooltip = true,
  size = 'md'
}: SyncStatusIndicatorProps) => {

  // Format the last synced time
  const formatLastSynced = () => {
    if (!lastSynced) return 'Never synced';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSynced.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Get status details based on current status
  const getStatusDetails = () => {
    switch (status) {
      case 'synced':
        return {
          icon: <CheckCircle2 className={cn(
            "text-terrafusion-green-500",
            size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
          )} />,
          label: 'Synced',
          description: lastSynced ? `Last sync: ${formatLastSynced()}` : 'Fully synchronized',
          badgeVariant: 'green-subtle' as const
        };
      case 'syncing':
        return {
          icon: <Loader2 className={cn(
            "text-terrafusion-blue-500 animate-spin",
            size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
          )} />,
          label: 'Syncing',
          description: 'Synchronizing data...',
          badgeVariant: 'blue-subtle' as const
        };
      case 'error':
        return {
          icon: <AlertCircle className={cn(
            "text-destructive",
            size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
          )} />,
          label: 'Error',
          description: 'Sync failed. Retry required.',
          badgeVariant: 'destructive' as const
        };
      case 'offline':
        return {
          icon: <WifiOff className={cn(
            "text-slate-500",
            size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
          )} />,
          label: 'Offline',
          description: 'No connection available',
          badgeVariant: 'outline' as const
        };
      case 'pending':
        return {
          icon: <ArrowDownUp className={cn(
            "text-terrafusion-soil-500",
            size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
          )} />,
          label: `Pending (${pendingChanges})`,
          description: `${pendingChanges} changes waiting to sync`,
          badgeVariant: 'soil-subtle' as const
        };
      case 'disabled':
        return {
          icon: <Ban className={cn(
            "text-slate-400",
            size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
          )} />,
          label: 'Disabled',
          description: 'Synchronization is disabled',
          badgeVariant: 'secondary' as const
        };
      default:
        return {
          icon: <Clock className={cn(
            "text-slate-400",
            size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
          )} />,
          label: 'Unknown',
          description: 'Status unknown',
          badgeVariant: 'outline' as const
        };
    }
  };

  const statusDetails = getStatusDetails();

  // Render with tooltip if requested
  const statusIndicator = (
    <div className={cn("flex items-center space-x-2", className)}>
      {statusDetails.icon}
      
      {showBadge && (
        <Badge variant={statusDetails.badgeVariant} className="text-xs">
          {statusDetails.label}
        </Badge>
      )}
    </div>
  );

  // Wrap in tooltip if requested
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {statusIndicator}
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm font-semibold">{statusDetails.label}</div>
            <div className="text-xs">{statusDetails.description}</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Return without tooltip
  return statusIndicator;
};