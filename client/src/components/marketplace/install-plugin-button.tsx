import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, CheckCircle, XCircle } from 'lucide-react';

interface InstallPluginButtonProps {
  pluginId: number;
  className?: string;
  onSuccess?: () => void;
}

type InstallationStatus = 'idle' | 'installing' | 'success' | 'error';

export function InstallPluginButton({ pluginId, className, onSuccess }: InstallPluginButtonProps) {
  const [status, setStatus] = useState<InstallationStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      console.log('WebSocket connected');
    };

    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Listen for job updates
        if (data.type === 'job_update' && jobId !== null && data.job.id === jobId) {
          // Update progress
          setProgress(data.job.progress || 0);
          
          // Update status message if available
          if (data.job.statusMessage) {
            setStatusMessage(data.job.statusMessage);
          }
          
          // Check job status
          if (data.job.status === 'completed') {
            setStatus('success');
            toast({
              title: 'Installation complete',
              description: 'Plugin has been successfully installed',
              variant: 'default',
            });
            if (onSuccess) onSuccess();
          } else if (data.job.status === 'failed') {
            setStatus('error');
            setError(data.job.error || 'Installation failed');
            toast({
              title: 'Installation failed',
              description: data.job.error || 'An error occurred during installation',
              variant: 'destructive',
            });
          }
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    newSocket.onclose = () => {
      console.log('WebSocket disconnected');
    };

    setSocket(newSocket);

    // Clean up the WebSocket connection on component unmount
    return () => {
      if (newSocket.readyState === WebSocket.OPEN) {
        newSocket.close();
      }
    };
  }, [jobId, toast, onSuccess]);

  const handleInstall = async () => {
    try {
      setStatus('installing');
      setProgress(0);
      setError(null);
      setStatusMessage(null);

      // Call the installation API
      const response = await apiRequest('POST', `/api/plugins/${pluginId}/install`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Installation failed');
      }

      const data = await response.json();
      setJobId(data.job.id);
      
      toast({
        title: 'Installation started',
        description: `Installing plugin: ${data.plugin.name}`,
      });
    } catch (err) {
      console.error('Error installing plugin:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'An error occurred');
      
      toast({
        title: 'Installation failed',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  // Render different button states based on installation status
  const renderButton = () => {
    switch (status) {
      case 'idle':
        return (
          <Button onClick={handleInstall} className={className}>
            <Download className="mr-2 h-4 w-4" />
            Install Plugin
          </Button>
        );
      
      case 'installing':
        return (
          <div className="flex flex-col gap-2 w-full max-w-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {statusMessage || 'Installing...'}
              </span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <Button disabled className={className}>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Installing...
            </Button>
          </div>
        );
      
      case 'success':
        return (
          <Button variant="outline" className={`bg-success/10 ${className}`} disabled>
            <CheckCircle className="mr-2 h-4 w-4 text-success" />
            Installed
          </Button>
        );
      
      case 'error':
        return (
          <Button variant="outline" className={`bg-destructive/10 ${className}`} onClick={handleInstall}>
            <XCircle className="mr-2 h-4 w-4 text-destructive" />
            Retry Installation
          </Button>
        );
      
      default:
        return null;
    }
  };

  return renderButton();
}