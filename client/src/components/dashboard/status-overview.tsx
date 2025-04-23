import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckIcon, MicrochipIcon, MemoryStick } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatusOverviewProps {
  metrics?: any;
  isLoading: boolean;
}

export default function StatusOverview({ metrics, isLoading }: StatusOverviewProps) {
  // Default values if data is not available
  const cpuUsage = metrics?.cpu?.value || 42;
  const memoryUsed = metrics?.memory?.used || 2.4;
  const memoryTotal = metrics?.memory?.total || 8;
  const memoryPercentage = (memoryUsed / memoryTotal) * 100;
  const systemStatus = metrics?.status || "Healthy";

  return (
    <div className="mt-6">
      <h2 className="text-lg font-medium text-gray-900">System Status</h2>
      <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* System Health Card */}
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-success rounded-md p-3">
                  <CheckIcon className="h-5 w-5 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  {isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    <>
                      <dt className="text-sm font-medium text-gray-500 truncate">System Health</dt>
                      <dd className="text-lg font-medium text-gray-900">{systemStatus}</dd>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-muted px-4 py-4 sm:px-6">
              <div className="text-sm">
                <a href="#" className="font-medium text-primary hover:opacity-80">View details</a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CPU Usage Card */}
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-warning rounded-md p-3">
                  <MicrochipIcon className="h-5 w-5 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  {isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    <>
                      <dt className="text-sm font-medium text-gray-500 truncate">CPU Usage</dt>
                      <dd className="text-lg font-medium text-gray-900">{cpuUsage}%</dd>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <div className="relative pt-1">
                  {isLoading ? (
                    <Skeleton className="h-2 w-full" />
                  ) : (
                    <Progress value={cpuUsage} className="h-2 bg-gray-200" indicatorClassName="bg-warning" />
                  )}
                </div>
              </div>
            </div>
            <div className="bg-muted px-4 py-4 sm:px-6">
              <div className="text-sm">
                <a href="#" className="font-medium text-primary hover:opacity-80">View metrics</a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage Card */}
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary rounded-md p-3">
                  <MemoryStick className="h-5 w-5 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  {isLoading ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    <>
                      <dt className="text-sm font-medium text-gray-500 truncate">Memory Usage</dt>
                      <dd className="text-lg font-medium text-gray-900">{memoryUsed} GB / {memoryTotal} GB</dd>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <div className="relative pt-1">
                  {isLoading ? (
                    <Skeleton className="h-2 w-full" />
                  ) : (
                    <Progress value={memoryPercentage} className="h-2 bg-gray-200" indicatorColor="bg-primary" />
                  )}
                </div>
              </div>
            </div>
            <div className="bg-muted px-4 py-4 sm:px-6">
              <div className="text-sm">
                <a href="#" className="font-medium text-primary hover:opacity-80">View metrics</a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
