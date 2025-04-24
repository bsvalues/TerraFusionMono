import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  WifiOff, 
  Wifi, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  Database,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface SyncStatusPanelProps {
  className?: string;
}

// The status values that can be returned from the server
type SyncStatus = 'syncing' | 'synced' | 'offline' | 'error' | 'delayed';

// Define types for API responses
interface SyncStatusResponse {
  status: SyncStatus;
  progress: number;
  lastSynced: string | null;
  pendingChanges: number;
}

interface Device {
  id: string;
  name: string;
  type: string;
  lastConnected: string;
  status: string;
}

interface DevicesResponse {
  devices: Device[];
}

export default function SyncStatusPanel({ className = '' }: SyncStatusPanelProps) {
  // Local state for sync status and dialog
  const [status, setStatus] = useState<SyncStatus>('offline');
  const [progress, setProgress] = useState(0);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState<number>(0);
  const [showDetails, setShowDetails] = useState(false);
  const [deviceCount, setDeviceCount] = useState(0);
  
  // Query to fetch the current sync status from the server
  const { data, isLoading, error, refetch } = useQuery<SyncStatusResponse>({
    queryKey: ['/api/sync/status'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Query to fetch connected devices
  const { data: deviceData } = useQuery<DevicesResponse>({
    queryKey: ['/api/sync/devices'],
    refetchInterval: 60000, // Refetch every minute
  });
  
  // Trigger manual sync
  const triggerSync = async () => {
    try {
      await fetch('/api/sync/trigger', {
        method: 'POST',
      });
      refetch();
    } catch (err) {
      console.error('Failed to trigger sync:', err);
    }
  };
  
  // Update state when data changes
  useEffect(() => {
    if (data) {
      setStatus(data.status);
      setProgress(data.progress);
      setLastSynced(data.lastSynced ? new Date(data.lastSynced) : null);
      setPendingChanges(data.pendingChanges);
    }
  }, [data]);
  
  // Update device count when device data changes
  useEffect(() => {
    if (deviceData && Array.isArray(deviceData.devices)) {
      setDeviceCount(deviceData.devices.length);
    }
  }, [deviceData]);
  
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
      case 'delayed':
        return <Clock className="h-4 w-4 mr-1" />;
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
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'synced':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'offline':
        return 'bg-slate-100 text-slate-800 hover:bg-slate-200';
      case 'delayed':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
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
      case 'delayed':
        return 'Delayed';
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
      <Badge variant="outline" className={`flex items-center ${className} bg-red-100 text-red-800`}>
        <AlertCircle className="h-4 w-4 mr-1" />
        <span>Connection Error</span>
      </Badge>
    );
  }
  
  return (
    <div className={className}>
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogTrigger asChild>
          <Badge 
            variant="outline" 
            className={`flex items-center cursor-pointer ${getBadgeStyling()}`}
          >
            {renderIcon()}
            <span>{getStatusLabel()}</span>
            {pendingChanges > 0 && (
              <span className="ml-1.5 text-xs bg-blue-500 text-white rounded-full px-1.5 py-0.5">
                {pendingChanges}
              </span>
            )}
          </Badge>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mobile Sync Status</DialogTitle>
            <DialogDescription>
              Monitor and manage synchronization with mobile devices.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  {renderIcon()}
                  <span className="ml-2">{getStatusLabel()}</span>
                </CardTitle>
                <CardDescription>
                  Last synchronized: {formatLastSynced()}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-2">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Connected devices:</span>
                    <Badge variant="outline" className="flex items-center">
                      <Database className="h-3 w-3 mr-1" />
                      <span>{deviceCount}</span>
                    </Badge>
                  </div>
                  
                  {pendingChanges > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Pending changes:</span>
                      <Badge variant="secondary">{pendingChanges}</Badge>
                    </div>
                  )}
                  
                  {status === 'syncing' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progress:</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="pt-2">
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerSync();
                  }} 
                  variant="outline" 
                  className="w-full"
                  disabled={status === 'syncing'}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowDetails(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-block">
              <Badge 
                variant="outline" 
                className={`flex items-center cursor-pointer ${getBadgeStyling()}`}
                onClick={() => setShowDetails(true)}
              >
                {renderIcon()}
                <span>{getStatusLabel()}</span>
                {pendingChanges > 0 && (
                  <span className="ml-1.5 text-xs bg-blue-500 text-white rounded-full px-1.5 py-0.5">
                    {pendingChanges}
                  </span>
                )}
              </Badge>
            </div>
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
              {deviceCount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Connected devices:</span>
                  <span className="font-medium">{deviceCount}</span>
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
              <div className="pt-1 text-xs text-blue-600">
                Click for details and controls
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}