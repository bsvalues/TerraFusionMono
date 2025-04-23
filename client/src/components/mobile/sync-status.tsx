import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Wifi, WifiOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

interface SyncStatusProps {
  className?: string;
}

// The status values that can be returned from the server
type SyncStatus = 'syncing' | 'synced' | 'offline' | 'error';

export function SyncStatus({ className = '' }: SyncStatusProps) {
  // Local state for sync status and progress
  const [status, setStatus] = useState<SyncStatus>('offline');
  const [progress, setProgress] = useState(0);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState<number>(0);

  // Query to fetch the current sync status from the server
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/mobile/sync/status'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update state when data changes
  useEffect(() => {
    if (data) {
      setStatus(data.status);
      setProgress(data.progress || 0);
      setLastSynced(data.lastSynced ? new Date(data.lastSynced) : null);
      setPendingChanges(data.pendingChanges || 0);
    }
  }, [data]);

  // Helper to format the last synced time
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
        return <Loader2 className="animate-spin h-4 w-4 mr-1" />;
      case 'synced':
        return <CheckCircle2 className="h-4 w-4 mr-1" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 mr-1" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 mr-1" />;
      default:
        return <Wifi className="h-4 w-4 mr-1" />;
    }
  };

  // Get badge styling based on status
  const getBadgeStyling = () => {
    switch (status) {
      case 'syncing':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
      case 'synced':
        return 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400';
      case 'offline':
        return 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-900/30 dark:text-slate-400';
      case 'error':
        return 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400';
      default:
        return '';
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
      case 'error':
        return 'Sync Error';
      default:
        return 'Unknown';
    }
  };
  
  // Show loading state during initial load
  if (isLoading) {
    return (
      <Badge variant="outline" className={`flex items-center ${className}`}>
        <Loader2 className="animate-spin h-4 w-4 mr-1" />
        <span>Loading...</span>
      </Badge>
    );
  }

  // Show error state
  if (error) {
    return (
      <Badge variant="outline" className={`flex items-center ${className} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`}>
        <AlertCircle className="h-4 w-4 mr-1" />
        <span>Connection Error</span>
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`flex items-center cursor-pointer ${getBadgeStyling()} ${className}`}
          >
            {renderIcon()}
            <span>{getStatusLabel()}</span>
            {pendingChanges > 0 && (
              <span className="ml-1.5 text-xs bg-blue-500 text-white rounded-full px-1.5 py-0.5">
                {pendingChanges}
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2 w-48">
            <div className="flex justify-between text-sm">
              <span>Status:</span>
              <span className="font-medium">{getStatusLabel()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Last synced:</span>
              <span className="font-medium">{formatLastSynced()}</span>
            </div>
            {pendingChanges > 0 && (
              <div className="flex justify-between text-sm">
                <span>Pending changes:</span>
                <span className="font-medium">{pendingChanges}</span>
              </div>
            )}
            {status === 'syncing' && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Progress:</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}