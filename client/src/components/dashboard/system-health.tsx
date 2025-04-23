import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DatabaseIcon, 
  ClockIcon, 
  AlertTriangleIcon 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface SystemHealthProps {
  health?: {
    database: {
      nextVacuum: string;
      lastVacuum: string;
    };
    pitr: {
      latestSnapshot: string;
      snapshotCount: number;
    };
    dlq: {
      itemCount: number;
      lastFailure?: string;
    };
  };
  isLoading: boolean;
}

export default function SystemHealth({ health, isLoading }: SystemHealthProps) {
  const { toast } = useToast();
  
  // Handle review DLQ action
  const handleReviewDLQ = async () => {
    try {
      // Redirect to DLQ review page or open modal
      toast({
        title: "Reviewing DLQ Items",
        description: "DLQ review interface not yet implemented.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch DLQ items.",
        variant: "destructive",
      });
    }
  };
  
  // Format dates for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="mt-8">
      <h2 className="text-lg font-medium text-gray-900">Scheduling & Monitoring</h2>
      <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Database Maintenance Card */}
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-secondary rounded-md p-3">
                  <DatabaseIcon className="h-5 w-5 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  {isLoading ? (
                    <Skeleton className="h-6 w-40" />
                  ) : (
                    <>
                      <dt className="text-sm font-medium text-gray-500 truncate">Database Maintenance</dt>
                      <dd className="text-lg font-medium text-gray-900">Nightly VACUUM</dd>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                {isLoading ? (
                  <>
                    <div className="flex justify-between mb-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Next run:</span>
                      <span className="font-medium">{formatDate(health?.database.nextVacuum)}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Last run:</span>
                      <span className="font-medium">{formatDate(health?.database.lastVacuum)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Point-in-Time Recovery Card */}
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-secondary rounded-md p-3">
                  <ClockIcon className="h-5 w-5 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  {isLoading ? (
                    <Skeleton className="h-6 w-40" />
                  ) : (
                    <>
                      <dt className="text-sm font-medium text-gray-500 truncate">Point-in-Time Recovery</dt>
                      <dd className="text-lg font-medium text-gray-900">PITR Snapshots</dd>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                {isLoading ? (
                  <>
                    <div className="flex justify-between mb-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Latest snapshot:</span>
                      <span className="font-medium">{formatDate(health?.pitr.latestSnapshot)}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Snapshot count:</span>
                      <span className="font-medium">{health?.pitr.snapshotCount || 0} (last 7 days)</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dead Letter Queue Card */}
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-secondary rounded-md p-3">
                  <AlertTriangleIcon className="h-5 w-5 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  {isLoading ? (
                    <Skeleton className="h-6 w-40" />
                  ) : (
                    <>
                      <dt className="text-sm font-medium text-gray-500 truncate">Dead Letter Queue</dt>
                      <dd className="text-lg font-medium text-gray-900">Error Handling</dd>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                {isLoading ? (
                  <>
                    <div className="flex justify-between mb-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>DLQ items:</span>
                      <span className={`font-medium ${health?.dlq.itemCount ? 'text-destructive' : ''}`}>
                        {health?.dlq.itemCount || 0}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Last failure:</span>
                      <span className="font-medium">{formatDate(health?.dlq.lastFailure)}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  className="w-full text-primary" 
                  onClick={handleReviewDLQ}
                  disabled={isLoading || !(health?.dlq.itemCount)}
                >
                  Review DLQ Items
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
