import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface Job {
  id: number;
  name: string;
  status: string;
  worker: string;
  progress: number;
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

interface JobsQueueProps {
  jobs?: Job[];
  isLoading: boolean;
}

export default function JobsQueue({ jobs = [], isLoading }: JobsQueueProps) {
  // Get job status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-primary/10 text-primary';
      case 'queued':
        return 'bg-warning/10 text-warning';
      case 'completed':
        return 'bg-success/10 text-success';
      case 'failed':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };
  
  // Format the time ago
  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };
  
  // Active and completed job counts
  const activeJobs = jobs?.filter(job => ['processing', 'queued'].includes(job.status)).length || 0;
  const completedJobs = jobs?.filter(job => job.status === 'completed').length || 0;
  
  // Display 3 most recent jobs
  const recentJobs = isLoading ? [] : jobs?.slice(0, 3) || [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Jobs Queue</h2>
        <a href="#" className="text-sm font-medium text-primary hover:text-primary/80">
          View Queue Dashboard →
        </a>
      </div>
      <Card className="mt-3">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            {isLoading ? (
              <>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-gray-900">Active Jobs: {activeJobs}</span>
                <span className="text-sm font-medium text-gray-900">Completed: {completedJobs}</span>
              </>
            )}
          </div>
          <div className="space-y-3">
            {isLoading ? (
              // Loading placeholders
              Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="mt-2">
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
              ))
            ) : (
              // Actual job data
              recentJobs.map((job) => (
                <div key={job.id} className="bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-900">{job.name}</span>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(job.status)}`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{job.worker}</span>
                    <span>
                      {job.status === 'processing' && job.startedAt && `Started ${formatTimeAgo(job.startedAt)}`}
                      {job.status === 'queued' && `Queued ${formatTimeAgo(job.queuedAt)}`}
                      {job.status === 'completed' && job.completedAt && `Completed ${formatTimeAgo(job.completedAt)}`}
                      {job.status === 'failed' && job.startedAt && `Failed ${formatTimeAgo(job.startedAt)}`}
                    </span>
                  </div>
                  
                  {/* Show progress bar for processing jobs */}
                  {job.status === 'processing' && (
                    <div className="mt-2 relative pt-1">
                      <Progress value={job.progress} className="h-2 bg-gray-200" />
                    </div>
                  )}
                  
                  {/* Show error message for failed jobs */}
                  {job.status === 'failed' && job.error && (
                    <div className="mt-1 text-xs text-destructive">
                      Error: {job.error}
                    </div>
                  )}
                </div>
              ))
            )}
            
            {/* No jobs message */}
            {!isLoading && recentJobs.length === 0 && (
              <div className="bg-gray-50 p-3 rounded-md text-center text-sm text-gray-500">
                No recent jobs found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
