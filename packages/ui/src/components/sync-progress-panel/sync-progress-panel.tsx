import * as React from 'react';
import { cn } from '../../utils';
import { 
  Wifi, 
  WifiOff,
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  Clock,
  Upload,
  Download,
  Battery,
  Signal,
  BarChart2,
  Smartphone,
  Database
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../card';
import { Button } from '../button';
import { Progress } from '../progress';
import { SyncStatus, SyncStatusIndicator } from '../sync-status-indicator';
import { Badge } from '../badge';

export interface SyncHistoryEntry {
  id: string;
  timestamp: string;
  status: 'completed' | 'partial' | 'failed';
  duration: number;
  bytesTransferred: number;
  recordsProcessed: number;
  operation: 'pull' | 'push' | 'bidirectional';
}

export interface DeviceInfo {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'synchronizing' | 'error';
  lastSeen: string;
  batteryLevel?: number;
  pendingUploads?: number;
  pendingDownloads?: number;
}

export interface SyncProgressPanelProps {
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
   * Active operations count
   */
  activeOperations?: number;
  /**
   * Queued operations count
   */
  queuedOperations?: number;
  /**
   * Total bytes to sync
   */
  totalBytes?: number;
  /**
   * Total bytes synced so far
   */
  totalSyncedBytes?: number;
  /**
   * Connected devices
   */
  devices?: DeviceInfo[];
  /**
   * Sync history entries
   */
  syncHistory?: SyncHistoryEntry[];
  /**
   * Callback for manual sync button
   */
  onSyncNow?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Displays detailed sync progress information with device status and controls
 */
export const SyncProgressPanel = ({
  status,
  progress = 0,
  lastSynced = null,
  pendingChanges = 0,
  activeOperations = 0,
  queuedOperations = 0,
  totalBytes = 0,
  totalSyncedBytes = 0,
  devices = [],
  syncHistory = [],
  onSyncNow,
  className = '',
}: SyncProgressPanelProps) => {
  // Format the last synced time
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

  // Format file size in human-readable format
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Format duration in seconds to human-readable format
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  // Get icon for history entry status
  const getHistoryStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Get device status badge
  const getDeviceStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'offline':
        return <Badge className="bg-slate-100 text-slate-800">Offline</Badge>;
      case 'synchronizing':
        return <Badge className="bg-blue-100 text-blue-800">Syncing</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Mobile Sync Status</CardTitle>
          <SyncStatusIndicator 
            status={status} 
            lastSynced={lastSynced}
            pendingChanges={pendingChanges}
          />
        </div>
        <CardDescription>
          Last synchronized: {formatLastSynced()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 flex items-center">
              <Smartphone className="h-3.5 w-3.5 mr-1.5" />
              Devices:
            </span>
            <Badge variant="outline" className="flex items-center">
              {devices.length}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 flex items-center">
              <Signal className="h-3.5 w-3.5 mr-1.5" />
              Online:
            </span>
            <Badge variant="outline" className="flex items-center bg-green-50">
              {devices.filter(d => d.status === 'online').length}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 flex items-center">
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Pending uploads:
            </span>
            <Badge variant="secondary">
              {devices.reduce((acc, device) => acc + (device.pendingUploads || 0), 0)}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 flex items-center">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Pending downloads:
            </span>
            <Badge variant="secondary">
              {devices.reduce((acc, device) => acc + (device.pendingDownloads || 0), 0)}
            </Badge>
          </div>
        </div>
        
        {/* Sync progress bar */}
        {status === 'syncing' && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progress:</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            {totalBytes > 0 && totalSyncedBytes >= 0 && (
              <div className="flex justify-end text-xs text-gray-500 mt-1">
                {formatFileSize(totalSyncedBytes)} / {formatFileSize(totalBytes)}
              </div>
            )}
            {activeOperations > 0 && (
              <div className="text-xs text-gray-500 flex items-center justify-end mt-1">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                {activeOperations} active operation{activeOperations !== 1 ? 's' : ''}
                {queuedOperations > 0 && `, ${queuedOperations} queued`}
              </div>
            )}
          </div>
        )}
        
        {/* Connected devices */}
        {devices.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Connected Devices</h4>
            <div className="space-y-2">
              {devices.slice(0, 3).map((device) => (
                <div key={device.id} className="p-2 border rounded-md bg-gray-50 flex justify-between items-center">
                  <div className="flex items-center">
                    <Smartphone className="h-4 w-4 mr-2 text-gray-500" />
                    <div>
                      <div className="font-medium text-sm">{device.name}</div>
                      <div className="text-xs text-gray-500">Last seen: {new Date(device.lastSeen).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {device.batteryLevel !== undefined && (
                      <div className="flex items-center text-xs">
                        <Battery className="h-3.5 w-3.5 mr-0.5" />
                        {device.batteryLevel}%
                      </div>
                    )}
                    {getDeviceStatusBadge(device.status)}
                  </div>
                </div>
              ))}
              {devices.length > 3 && (
                <div className="text-center text-sm text-blue-600 hover:text-blue-800 cursor-pointer py-1">
                  Show {devices.length - 3} more device{devices.length - 3 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Sync History */}
        {syncHistory.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
            <div className="space-y-2">
              {syncHistory.slice(0, 3).map((entry) => (
                <div key={entry.id} className="p-2 border rounded-md bg-gray-50 flex justify-between items-start">
                  <div className="flex items-start">
                    {getHistoryStatusIcon(entry.status)}
                    <div className="ml-2">
                      <div className="text-sm font-medium">
                        {entry.operation === 'pull' ? 'Downloaded' : 
                         entry.operation === 'push' ? 'Uploaded' : 'Synced'} {entry.recordsProcessed} records
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleString()} • {formatDuration(entry.duration)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs">
                    {formatFileSize(entry.bytesTransferred)}
                  </div>
                </div>
              ))}
              {syncHistory.length > 3 && (
                <div className="text-center text-sm text-blue-600 hover:text-blue-800 cursor-pointer py-1">
                  View full history
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2">
        <Button 
          onClick={onSyncNow} 
          variant="outline" 
          className="w-full"
          disabled={status === 'syncing'}
          loading={status === 'syncing'}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync Now
        </Button>
      </CardFooter>
    </Card>
  );
};