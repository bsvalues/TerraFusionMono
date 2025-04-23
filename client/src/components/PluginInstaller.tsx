import React, { useState } from 'react';
import { 
  Button, 
  Progress, 
  Card, 
  Text, 
  Badge, 
  Flex, 
  Box, 
  Alert, 
  AlertTitle, 
  AlertDescription,
  Spinner,
} from "@/components/ui";
import { Download, Check, AlertCircle, Info } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface PluginInstallProps {
  pluginId: number;
  name: string;
  version: string;
  description: string;
  isInstalled: boolean;
  author: string;
  size: string;
  price?: string;
  tags?: string[];
  onInstallComplete?: () => void;
}

interface InstallProgressState {
  stage: 'idle' | 'download' | 'validate' | 'configure' | 'complete' | 'error';
  progress: number;
  message: string;
}

export default function PluginInstaller({
  pluginId,
  name,
  version,
  description,
  isInstalled,
  author,
  size,
  price,
  tags = [],
  onInstallComplete,
}: PluginInstallProps) {
  const [installProgress, setInstallProgress] = useState<InstallProgressState>({
    stage: 'idle',
    progress: 0,
    message: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simulate installation progress
  const simulateInstallProgress = async () => {
    // Start with download stage
    setInstallProgress({
      stage: 'download',
      progress: 0,
      message: 'Downloading plugin...',
    });

    // Simulate download progress (0-40%)
    for (let i = 0; i <= 40; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 150));
      setInstallProgress(prev => ({
        ...prev,
        progress: i,
      }));
    }

    // Validation stage (40-60%)
    setInstallProgress({
      stage: 'validate',
      progress: 40,
      message: 'Validating plugin...',
    });

    for (let i = 40; i <= 60; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setInstallProgress(prev => ({
        ...prev,
        progress: i,
      }));
    }

    // Configuration stage (60-95%)
    setInstallProgress({
      stage: 'configure',
      progress: 60,
      message: 'Configuring plugin...',
    });

    for (let i = 60; i <= 95; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 120));
      setInstallProgress(prev => ({
        ...prev,
        progress: i,
      }));
    }

    // Complete stage (100%)
    setInstallProgress({
      stage: 'complete',
      progress: 100,
      message: 'Installation complete!',
    });
  };

  // Mutation for plugin installation
  const installMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/plugins/${pluginId}/install`);
      return response.json();
    },
    onMutate: async () => {
      // Start progress simulation
      simulateInstallProgress();
    },
    onSuccess: (data) => {
      // Ensure we show 100% even if the server responded quickly
      setInstallProgress({
        stage: 'complete',
        progress: 100,
        message: 'Installation complete!',
      });
      
      // Show success toast
      toast({
        title: "Installation Successful",
        description: `${name} v${version} has been installed successfully.`,
        variant: "success",
      });
      
      // Invalidate queries to refresh plugin lists
      queryClient.invalidateQueries({ queryKey: ['/api/plugins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/plugins'] });
      
      // Callback for parent component if needed
      if (onInstallComplete) {
        onInstallComplete();
      }
    },
    onError: (error: Error) => {
      setInstallProgress({
        stage: 'error',
        progress: 0,
        message: error.message || 'Installation failed',
      });
      
      toast({
        title: "Installation Failed",
        description: error.message || "An error occurred during installation.",
        variant: "destructive",
      });
    },
  });

  const handleInstall = () => {
    installMutation.mutate();
  };

  const getProgressColor = () => {
    switch (installProgress.stage) {
      case 'error': return 'bg-destructive';
      case 'complete': return 'bg-success';
      default: return 'bg-primary';
    }
  };

  // Helper to render the current stage icon
  const renderStageIcon = () => {
    switch (installProgress.stage) {
      case 'download':
        return <Download className="animate-pulse" />;
      case 'validate':
      case 'configure':
        return <Spinner className="h-4 w-4" />;
      case 'complete':
        return <Check className="text-success" />;
      case 'error':
        return <AlertCircle className="text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Text className="text-xl font-bold">{name}</Text>
            <Text className="text-sm text-muted-foreground">{author} • v{version}</Text>
          </div>
          <div className="flex items-center gap-2">
            {price ? (
              <Badge variant="secondary">{price}</Badge>
            ) : (
              <Badge variant="secondary">Free</Badge>
            )}
            <Badge variant="outline">{size}</Badge>
          </div>
        </div>
        
        <Text className="mb-4">{description}</Text>
        
        <Flex className="gap-2 flex-wrap mb-4">
          {tags.map((tag, idx) => (
            <Badge key={idx} variant="outline">{tag}</Badge>
          ))}
        </Flex>
        
        {installProgress.stage !== 'idle' && (
          <Box className="mb-6">
            <Flex className="items-center gap-2 mb-2">
              {renderStageIcon()}
              <Text className="font-medium">{installProgress.message}</Text>
            </Flex>
            <Progress 
              value={installProgress.progress} 
              className={`h-2 ${installProgress.stage === 'error' ? 'bg-destructive/20' : ''}`}
              indicatorClassName={getProgressColor()}
            />
          </Box>
        )}
        
        {installProgress.stage === 'error' && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to install the plugin. Please try again or contact support.
            </AlertDescription>
          </Alert>
        )}
        
        {installProgress.stage === 'complete' ? (
          <Alert variant="success" className="mb-4">
            <Check className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Plugin installed successfully!
            </AlertDescription>
          </Alert>
        ) : (
          <Button 
            disabled={isInstalled || installProgress.stage !== 'idle' || installMutation.isPending} 
            onClick={handleInstall}
            className="w-full"
          >
            {isInstalled ? 'Already Installed' : 'Install Plugin'}
          </Button>
        )}
        
        {installProgress.stage === 'idle' && isInstalled && (
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              This plugin is already installed on your system.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
}