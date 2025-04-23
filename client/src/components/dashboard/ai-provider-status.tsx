import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface AiOperation {
  name: string;
  timestamp: string;
}

interface AiProvider {
  id: number;
  name: string;
  status: string;
  apiRate: number;
}

interface AiProviderStatusProps {
  providers?: {
    providers: AiProvider[];
    currentPriority: string;
    recentOperations: AiOperation[];
  };
  isLoading: boolean;
}

export default function AiProviderStatus({ providers, isLoading }: AiProviderStatusProps) {
  const currentPriority = providers?.currentPriority || "openai, anthropic";
  const providersList = providers?.providers || [];
  const recentOperations = providers?.recentOperations || [];
  
  // Format operation time
  const formatTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success';
      case 'standby':
        return 'bg-warning/10 text-warning';
      case 'error':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900">AI Provider Status</h2>
      <Card className="mt-3">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            {isLoading ? (
              <>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-40" />
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-gray-900">Current Priority:</span>
                <span className="text-sm font-medium text-primary">{currentPriority}</span>
              </>
            )}
          </div>
          
          <div className="space-y-4">
            {isLoading ? (
              // Loading placeholders
              Array.from({ length: 2 }, (_, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))
            ) : (
              // Provider list
              providersList.map((provider) => (
                <div key={provider.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{provider.name}</span>
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(provider.status)}`}>
                        {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">API Rate: {provider.apiRate}%</span>
                  </div>
                  <div className="relative pt-1">
                    <Progress 
                      value={provider.apiRate} 
                      className="h-2 bg-gray-200"
                      indicatorClassName={provider.apiRate > 90 ? "bg-success" : "bg-warning"}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Recent AI Operations</h3>
            
            {isLoading ? (
              // Loading placeholders for operations
              <div className="space-y-2">
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : recentOperations.length > 0 ? (
              // Recent operations list
              <div className="space-y-2 text-xs text-gray-500">
                {recentOperations.map((op, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{op.name}</span>
                    <span>{formatTime(op.timestamp)}</span>
                  </div>
                ))}
              </div>
            ) : (
              // No operations message
              <div className="text-xs text-gray-500 text-center">
                No recent AI operations
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
