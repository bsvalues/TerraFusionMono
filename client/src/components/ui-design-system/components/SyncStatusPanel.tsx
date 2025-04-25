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
  Clock,
  Smartphone,
  Battery,
  Upload,
  Download,
  Signal,
  BarChart2,
  MapPin,
  Info,
  Calendar
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
  activeOperations?: number;
  syncQueue?: number;
  totalBytes?: number;
  totalSyncedBytes?: number;
}

// Device status types from the server
type DeviceStatus = 'online' | 'offline' | 'synchronizing' | 'error';
type SyncOperation = 'pull' | 'push' | 'bidirectional';
type SyncPriority = 'low' | 'medium' | 'high' | 'critical';

// Sync history entry type
interface SyncHistoryEntry {
  id: string;
  timestamp: string;
  status: 'completed' | 'partial' | 'failed';
  duration: number;
  bytesTransferred: number;
  recordsProcessed: number;
  operation: SyncOperation;
}

// Location data type
interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

// Enhanced device interface
interface Device {
  id: string;
  uuid: string;
  name: string;
  status: DeviceStatus;
  lastSeen: string;
  firstSeen: string;
  syncStatus: SyncStatus;
  batteryLevel: number;
  storageUsed: number;
  pendingUploads: number;
  pendingDownloads: number;
  lastLocation?: LocationData;
  connectionType: string;
  osVersion: string;
  appVersion: string;
  syncHistory: SyncHistoryEntry[];
}

// Metrics response type
interface SyncMetricsResponse {
  success: boolean;
  metrics: {
    devices: {
      total: number;
      online: number;
      offline: number;
      withErrors: number;
    };
    pending: {
      uploads: number;
      downloads: number;
      total: number;
    };
    syncOperations: {
      last24h: number;
      bytesTransferred24h: number;
      activeOperations: number;
      queuedOperations: number;
    };
    currentStatus: SyncStatus;
    lastSynced: string | null;
  };
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
  
  // Query to fetch sync metrics
  const { data: metricsData } = useQuery<SyncMetricsResponse>({
    queryKey: ['/api/sync/metrics'],
    refetchInterval: 60000, // Refetch every minute
  });
  
  // State for advanced sync options
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [syncOperation, setSyncOperation] = useState<SyncOperation>('bidirectional');
  const [syncPriority, setSyncPriority] = useState<SyncPriority>('medium');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('all');
  
  // Define available priority options
  const priorityOptions: Array<{ value: SyncPriority; label: string }> = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];
  
  // Define available operation types
  const operationOptions: Array<{ value: SyncOperation; label: string; description: string }> = [
    { value: 'bidirectional', label: 'Bidirectional', description: 'Sync data in both directions' },
    { value: 'push', label: 'Push', description: 'Send local changes to the server' },
    { value: 'pull', label: 'Pull', description: 'Download latest data from the server' }
  ];
  
  // Trigger manual sync with options
  const triggerSync = async () => {
    try {
      await fetch('/api/sync/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operationType: syncOperation,
          deviceId: selectedDeviceId,
          priority: syncPriority
        })
      });
      
      // Reset advanced options panel
      setShowAdvancedOptions(false);
      
      // Refresh data
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
        
        <DialogContent className="sm:max-w-[90vw] md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mobile Sync Status</DialogTitle>
            <DialogDescription>
              Monitor and manage synchronization with mobile devices
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {/* Current Sync Status Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  {renderIcon()}
                  <span className="ml-2">{getStatusLabel()}</span>
                  {status === 'syncing' && data?.activeOperations && (
                    <Badge variant="outline" className="ml-2">
                      {data.activeOperations} active operation{data.activeOperations !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Last synchronized: {formatLastSynced()}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-2">
                <div className="space-y-4">
                  {/* Device statistics */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 flex items-center">
                        <Smartphone className="h-3.5 w-3.5 mr-1.5" />
                        Devices:
                      </span>
                      <Badge variant="outline" className="flex items-center">
                        {deviceCount}
                      </Badge>
                    </div>
                    
                    {metricsData?.metrics?.devices?.online !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 flex items-center">
                          <Signal className="h-3.5 w-3.5 mr-1.5" />
                          Online:
                        </span>
                        <Badge variant="outline" className="flex items-center bg-green-50">
                          {metricsData?.metrics?.devices?.online || 0}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Pending changes */}
                  {(pendingChanges > 0 || (metricsData?.metrics?.pending?.total || 0) > 0) && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 flex items-center">
                          <Upload className="h-3.5 w-3.5 mr-1.5" />
                          Pending uploads:
                        </span>
                        <Badge variant="secondary">
                          {metricsData?.metrics?.pending?.uploads || 0}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 flex items-center">
                          <Download className="h-3.5 w-3.5 mr-1.5" />
                          Pending downloads:
                        </span>
                        <Badge variant="secondary">
                          {metricsData?.metrics?.pending?.downloads || 0}
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  {/* Sync progress bar */}
                  {status === 'syncing' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progress:</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      {data?.totalBytes && data?.totalSyncedBytes && (
                        <div className="flex justify-end text-xs text-gray-500 mt-1">
                          {Math.round(data.totalSyncedBytes / 1024 / 1024 * 10) / 10} MB / 
                          {Math.round(data.totalBytes / 1024 / 1024 * 10) / 10} MB
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Sync statistics */}
                  {metricsData?.metrics?.syncOperations && (
                    <div className="border rounded-md p-2 bg-gray-50">
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <BarChart2 className="h-4 w-4 mr-1.5" /> 
                        Sync Statistics (Last 24h)
                      </h4>
                      <div className="grid grid-cols-2 gap-y-1 text-xs">
                        <div>Sync operations:</div>
                        <div className="font-medium text-right">
                          {metricsData.metrics.syncOperations.last24h}
                        </div>
                        <div>Data transferred:</div>
                        <div className="font-medium text-right">
                          {Math.round(metricsData.metrics.syncOperations.bytesTransferred24h / 1024 / 1024 * 10) / 10} MB
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="pt-2 flex flex-col space-y-2">
                {!showAdvancedOptions ? (
                  <>
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
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAdvancedOptions(true);
                      }}
                      variant="ghost"
                      className="w-full text-xs"
                      disabled={status === 'syncing'}
                    >
                      Show advanced options
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="border rounded-md p-3 space-y-3">
                      {/* Sync Operation Type */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium">Sync Operation:</label>
                        <div className="grid grid-cols-3 gap-2">
                          {operationOptions.map(option => (
                            <Button
                              key={option.value}
                              type="button"
                              variant={syncOperation === option.value ? "default" : "outline"}
                              size="sm"
                              className="h-auto py-1.5 flex-col items-center justify-center"
                              onClick={() => setSyncOperation(option.value)}
                            >
                              <span>{option.label}</span>
                              <span className="text-[10px] mt-1 leading-tight opacity-70">
                                {option.description}
                              </span>
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Sync Priority */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium">Priority:</label>
                        <div className="grid grid-cols-4 gap-2">
                          {priorityOptions.map(option => (
                            <Button
                              key={option.value}
                              type="button"
                              variant={syncPriority === option.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSyncPriority(option.value)}
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Device Selection */}
                      {deviceData?.devices && deviceData.devices.length > 0 && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium">Target Device:</label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              type="button"
                              variant={selectedDeviceId === 'all' ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedDeviceId('all')}
                            >
                              All Devices
                            </Button>
                            
                            {deviceData.devices.map(device => (
                              <Button
                                key={device.id}
                                type="button"
                                variant={selectedDeviceId === device.id ? "default" : "outline"}
                                size="sm"
                                className="text-xs overflow-hidden text-ellipsis whitespace-nowrap"
                                title={device.name}
                                onClick={() => setSelectedDeviceId(device.id)}
                                disabled={device.status === 'offline'}
                              >
                                {device.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-row gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAdvancedOptions(false);
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          triggerSync();
                        }}
                        className="flex-1"
                        disabled={status === 'syncing'}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Start Sync
                      </Button>
                    </div>
                  </>
                )}
              </CardFooter>
            </Card>
            
            {/* Connected Devices List */}
            {deviceData?.devices && deviceData.devices.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md flex items-center">
                    <Smartphone className="h-4 w-4 mr-2" />
                    <span>Connected Devices</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-3">
                    {deviceData.devices.map((device) => (
                      <div key={device.id} className="border rounded-md p-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{device.name}</span>
                          <Badge 
                            className={
                              device.status === 'online' ? 'bg-green-50 text-green-700' :
                              device.status === 'synchronizing' ? 'bg-blue-50 text-blue-700' :
                              device.status === 'error' ? 'bg-red-50 text-red-700' :
                              'bg-gray-50 text-gray-700'
                            }
                            variant="outline"
                          >
                            {device.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Last seen:
                          </div>
                          <div>
                            {new Date(device.lastSeen).toLocaleString('en-US', { 
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          
                          <div className="flex items-center">
                            <Battery className="h-3 w-3 mr-1" />
                            Battery:
                          </div>
                          <div>
                            {device.batteryLevel}%
                          </div>
                          
                          {device.lastLocation && (
                            <>
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                Location:
                              </div>
                              <div>
                                {device.lastLocation.latitude.toFixed(4)}, {device.lastLocation.longitude.toFixed(4)}
                              </div>
                            </>
                          )}
                          
                          <div className="flex items-center">
                            <Info className="h-3 w-3 mr-1" />
                            OS:
                          </div>
                          <div>
                            {device.osVersion}
                          </div>
                          
                          {device.connectionType && (
                            <>
                              <div className="flex items-center">
                                <Signal className="h-3 w-3 mr-1" />
                                Connection:
                              </div>
                              <div>
                                {device.connectionType}
                              </div>
                            </>
                          )}
                          
                          {(device.pendingUploads > 0 || device.pendingDownloads > 0) && (
                            <>
                              <div className="flex items-center">
                                <Upload className="h-3 w-3 mr-1" />
                                Pending:
                              </div>
                              <div>
                                ↑ {device.pendingUploads}, ↓ {device.pendingDownloads}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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