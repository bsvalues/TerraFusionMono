import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  AlertCircle, 
  ArrowUpDown, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Settings, 
  XCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Job } from "@shared/schema";

// Type for sorted column
type SortColumn = {
  column: keyof Job | "";
  direction: "asc" | "desc";
};

export default function JobQueuePage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>({
    column: "timestamp",
    direction: "desc",
  });

  // Fetch jobs from API
  const { data: jobs, isLoading, isError, refetch } = useQuery({
    queryKey: ["/api/jobs"],
    staleTime: 30000, // 30 seconds
  });

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Calculate time elapsed
  const getTimeElapsed = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    const elapsed = now - start;

    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // Sort and filter jobs
  const processedJobs = () => {
    if (!jobs) return [];

    let filteredJobs = [...jobs];

    // Filter by status if tab is not 'all'
    if (activeTab !== "all") {
      filteredJobs = filteredJobs.filter(job => job.status === activeTab);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.name.toLowerCase().includes(query) || 
        job.id.toString().includes(query) ||
        (job.description && job.description.toLowerCase().includes(query))
      );
    }

    // Sort by the selected column
    if (sortColumn.column) {
      filteredJobs.sort((a: any, b: any) => {
        if (a[sortColumn.column] < b[sortColumn.column]) {
          return sortColumn.direction === "asc" ? -1 : 1;
        }
        if (a[sortColumn.column] > b[sortColumn.column]) {
          return sortColumn.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredJobs;
  };

  // Toggle sort direction
  const toggleSort = (column: keyof Job) => {
    setSortColumn(prev => ({
      column,
      direction: prev.column === column && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Job Queue</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage background jobs
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="h-9 px-4 flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-4 flex items-center"
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Job Queue Overview</CardTitle>
            <CardDescription>
              Monitor and manage system jobs and tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{jobs?.length || 0}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" /> Running
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-500">
                    {jobs?.filter(job => job.status === "running").length || 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    <span className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Completed
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    {jobs?.filter(job => job.status === "completed").length || 0}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    <span className="flex items-center">
                      <XCircle className="h-4 w-4 mr-1" /> Failed
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">
                    {jobs?.filter(job => job.status === "failed").length || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Job Queue</CardTitle>
              <CardDescription>
                View and manage all system jobs
              </CardDescription>
            </div>
            <div className="w-full md:w-auto">
              <Input 
                placeholder="Search jobs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">All Jobs</TabsTrigger>
              <TabsTrigger value="running">Running</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load jobs. Please try again.
              </AlertDescription>
            </Alert>
          ) : processedJobs().length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground">No jobs found</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">
                      <Button 
                        variant="ghost" 
                        onClick={() => toggleSort("id")}
                        className="font-medium flex items-center"
                      >
                        ID
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        onClick={() => toggleSort("name")}
                        className="font-medium flex items-center"
                      >
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        onClick={() => toggleSort("progress")}
                        className="font-medium flex items-center"
                      >
                        Progress
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button 
                        variant="ghost" 
                        onClick={() => toggleSort("timestamp")}
                        className="font-medium flex items-center"
                      >
                        Created
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Runtime</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedJobs().map((job: any) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.id}</TableCell>
                      <TableCell>{job.name}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            job.status === "completed" ? "success" : 
                            job.status === "running" ? "default" :
                            job.status === "failed" ? "destructive" :
                            "outline"
                          }
                        >
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress 
                            value={job.progress || 0} 
                            className="h-2 w-[100px]"
                            indicatorClassName={
                              job.status === "failed" ? "bg-red-500" :
                              job.status === "completed" ? "bg-green-500" :
                              undefined
                            }
                          />
                          <span>{job.progress || 0}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {formatDate(job.timestamp)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getTimeElapsed(job.timestamp)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}