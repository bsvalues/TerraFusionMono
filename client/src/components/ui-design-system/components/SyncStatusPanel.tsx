import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WifiOff, Wifi, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SyncStatusPanelProps {
  className?: string;
}

// The status values that can be returned from the server
type SyncStatus = 'syncing' | 'synced' | 'offline' | 'error' | 'delayed';

export default function SyncStatusPanel({ className = '' }: SyncStatusPanelProps) {
  // Local state for sync status
  const [status, setStatus] = useState<SyncStatus>('offline');
  
  // Query to fetch the current sync status from the server
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/sync/status'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Update state when data changes
  useEffect(() => {
    if (data) {
      setStatus(data.status || 'offline');
    }
  }, [data]);
  
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
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'synced':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'offline':
        return 'bg-slate-100 text-slate-800 hover:bg-slate-200';
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
    <Badge 
      variant="outline" 
      className={`flex items-center cursor-pointer ${className} ${getBadgeStyling()}`}
    >
      {renderIcon()}
      <span>{getStatusLabel()}</span>
    </Badge>
  );
}