import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  Button, 
  Progress, 
  Badge,
  Alert,
  AlertTitle, 
  AlertDescription 
} from "@/components/ui";
import { CheckCircle, AlertCircle, Download, Package } from 'lucide-react';

interface PluginInstallerProps {
  pluginId: number;
  name: string;
  description: string;
  author: string;
  version: string;
  isInstalled: boolean;
  size: string;
  price?: string;
  tags: string[];
  onInstallComplete?: () => void;
}

const PluginInstaller: React.FC<PluginInstallerProps> = ({ 
  pluginId, 
  name, 
  description, 
  author, 
  version, 
  isInstalled, 
  size,
  price,
  tags,
  onInstallComplete 
}) => {
  const [installProgress, setInstallProgress] = useState(0);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'success' | 'error'>('idle');
  const [jobId, setJobId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation to initiate plugin installation
  const installMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/plugins/${pluginId}/install`);
      const data = await res.json();
      return data;
    },
    onSuccess: (data) => {
      setJobId(data.job.id);
      setInstallStatus('installing');
      setInstallProgress(10); // Initial progress
      
      toast({
        title: 'Installation started',
        description: `${name} is being installed. This might take a moment.`,
      });
    },
    onError: (error: Error) => {
      setInstallStatus('error');
      
      toast({
        title: 'Installation failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Query to check job status if we're installing
  const { data: jobData, refetch } = useQuery({
    queryKey: [`/api/jobs/${jobId}`],
    queryFn: async () => {
      if (!jobId) return null;
      const res = await apiRequest('GET', `/api/jobs/${jobId}`);
      return res.json();
    },
    enabled: Boolean(jobId) && installStatus === 'installing',
    refetchInterval: installStatus === 'installing' ? 1000 : false,
  });

  // Effect to update progress based on job status
  useEffect(() => {
    if (jobData && installStatus === 'installing') {
      switch(jobData.status) {
        case 'in-progress':
          // Update progress randomly but increasingly to simulate installation
          setInstallProgress((prev) => 
            Math.min(90, prev + Math.floor(Math.random() * 10))
          );
          break;
        case 'completed':
          setInstallProgress(100);
          setInstallStatus('success');
          if (onInstallComplete) {
            onInstallComplete();
          }
          queryClient.invalidateQueries({ queryKey: ['/api/user/plugins'] });
          toast({
            title: 'Installation complete',
            description: `${name} has been successfully installed.`,
          });
          break;
        case 'failed':
          setInstallStatus('error');
          toast({
            title: 'Installation failed',
            description: jobData.error || 'An error occurred during installation.',
            variant: 'destructive',
          });
          break;
      }
    }
  }, [jobData, installStatus, name, queryClient, toast, onInstallComplete]);

  // Function to handle install button click
  const handleInstall = () => {
    setInstallStatus('installing');
    setInstallProgress(0);
    installMutation.mutate();
  };

  // Function to retry installation
  const handleRetry = () => {
    setInstallStatus('idle');
    setJobId(null);
    setInstallProgress(0);
  };

  return (
    <Card className="p-6 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">{name}</h3>
          <p className="text-sm text-muted-foreground">{author} • v{version}</p>
        </div>
        {price ? (
          <Badge variant="outline">{price}</Badge>
        ) : (
          <Badge variant="secondary">Free</Badge>
        )}
      </div>
      
      <p className="mb-4">{description}</p>
      
      <div className="flex gap-2 flex-wrap mb-4">
        {tags.map((tag, idx) => (
          <Badge key={idx} variant="outline">{tag}</Badge>
        ))}
        <Badge variant="outline">{size}</Badge>
      </div>
      
      {installStatus === 'installing' && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Installing...</span>
            <span className="text-sm">{installProgress}%</span>
          </div>
          <Progress value={installProgress} className="h-2" />
        </div>
      )}
      
      {installStatus === 'success' && (
        <Alert className="mb-4 border-green-500/50 text-green-700">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Installation Successful</AlertTitle>
          <AlertDescription>
            {name} v{version} has been installed and is ready to use.
          </AlertDescription>
        </Alert>
      )}
      
      {installStatus === 'error' && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Installation Failed</AlertTitle>
          <AlertDescription>
            There was an error installing {name}. Please try again.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="mt-auto pt-4">
        {isInstalled ? (
          <Button variant="secondary" className="w-full" disabled>
            <Package className="mr-2 h-4 w-4" />
            Installed
          </Button>
        ) : installStatus === 'installing' ? (
          <Button variant="secondary" className="w-full" disabled>
            <div className="animate-spin mr-2 h-4 w-4 border-2 border-current rounded-full border-t-transparent" />
            Installing...
          </Button>
        ) : installStatus === 'success' ? (
          <Button variant="outline" className="w-full" disabled>
            <CheckCircle className="mr-2 h-4 w-4" />
            Installed
          </Button>
        ) : installStatus === 'error' ? (
          <Button variant="outline" className="w-full" onClick={handleRetry}>
            <AlertCircle className="mr-2 h-4 w-4" />
            Retry
          </Button>
        ) : (
          <Button className="w-full" onClick={handleInstall}>
            <Download className="mr-2 h-4 w-4" />
            Install
          </Button>
        )}
      </div>
    </Card>
  );
};

export default PluginInstaller;