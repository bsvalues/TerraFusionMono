import * as React from 'react';
import { cn } from '../../utils';
import { 
  WifiOff, 
  Wifi, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Clock
} from 'lucide-react';

export type SyncStatus = 'syncing' | 'synced' | 'offline' | 'error' | 'delayed';

export interface SyncStatusIndicatorProps {
  /**
   * Current sync status
   */
  status: SyncStatus;
  /**
   * Progress percentage (0-100) when status is 'syncing'
   */
  progress?: number;
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
   * Whether the indicator is clickable
   */
  clickable?: boolean;
  /**
   * Click handler
   */
  onClick?: () => void;
}

/**
 * Displays the current sync status with visual indicators
 */
export const SyncStatusIndicator = ({
  status,
  progress = 0,
  lastSynced = null,
  pendingChanges = 0,
  className = '',
  clickable = false,
  onClick,
}: SyncStatusIndicatorProps) => {
  // Get status styling based on status
  const getStatusStyling = () => {
    switch (status) {
      case 'syncing':
        return 'bg-terrafusion-blue-100 text-terrafusion-blue-800 hover:bg-terrafusion-blue-200';
      case 'synced':
        return 'bg-terrafusion-green-100 text-terrafusion-green-800 hover:bg-terrafusion-green-200';
      case 'offline':
        return 'bg-slate-100 text-slate-800 hover:bg-slate-200';
      case 'delayed':
        return 'bg-terrafusion-soil-100 text-terrafusion-soil-800 hover:bg-terrafusion-soil-200';
      case 'error':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return '';
    }
  };

  // Format last synced time
  const formatLastSynced = () => {
    if (!lastSynced) return 'Never';
    
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

  // Render the appropriate icon based on status
  const renderIcon = () => {
    switch (status) {
      case 'syncing':
        return <Loader2 className="animate-spin h-4 w-4 mr-1.5" />;
      case 'synced':
        return <CheckCircle2 className="h-4 w-4 mr-1.5" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 mr-1.5" />;
      case 'delayed':
        return <Clock className="h-4 w-4 mr-1.5" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 mr-1.5" />;
      default:
        return <Wifi className="h-4 w-4 mr-1.5" />;
    }
  };

  // Get the status label text
  const getStatusLabel = () => {
    switch (status) {
      case 'syncing':
        return 'Syncing';
      case 'synced':
        return 'Synced';
      case 'offline':
        return 'Offline';
      case 'delayed':
        return 'Delayed';
      case 'error':
        return 'Sync Error';
      default:
        return 'Unknown';
    }
  };

  const containerClasses = cn(
    'inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium',
    getStatusStyling(),
    clickable && 'cursor-pointer transition-colors duration-200',
    className
  );

  return (
    <div className={containerClasses} onClick={clickable ? onClick : undefined} role={clickable ? 'button' : undefined}>
      {renderIcon()}
      <span>{getStatusLabel()}</span>
      {pendingChanges > 0 && (
        <span className="ml-1.5 text-xs bg-blue-500 text-white rounded-full px-1.5 py-0.5">
          {pendingChanges}
        </span>
      )}
      {lastSynced && (
        <span className="ml-1.5 text-xs opacity-80">
          ({formatLastSynced()})
        </span>
      )}
    </div>
  );
};