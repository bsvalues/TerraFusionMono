import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertCircle, ArrowUpRight, CpuIcon, DatabaseIcon, Globe, HardDrive, Network, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

// Generate sample data for charts
const generateData = (days = 30, base = 50, variance = 20) => {
  return Array.from({ length: days }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));
    return {
      date: date.toISOString().split('T')[0],
      value: Math.max(0, Math.floor(base + Math.random() * variance - variance / 2)),
    };
  });
};

const cpuData = generateData(30, 60, 40);
const memoryData = generateData(30, 75, 25);
const networkData = generateData(30, 45, 35);
const diskData = generateData(30, 55, 20);

export default function MetricsPage() {
  const [timeRange, setTimeRange] = useState("30d");
  const { data: metricsData, isLoading } = useQuery<{
    status: string;
    cpu?: { value: number; trend: string };
    memory?: { value: number; trend: string };
    disk?: { value: number; trend: string };
    network?: { value: number; trend: string };
  }>({
    queryKey: ["/api/metrics"],
    staleTime: 60000, // 1 minute
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">System Metrics</h1>
          <p className="text-muted-foreground mt-1">
            Monitor system performance and resource usage
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsData?.cpu?.value || 0}%
            </div>
            <Progress 
              value={metricsData?.cpu?.value || 0} 
              className="h-2 mt-2"
              indicatorClassName={
                (metricsData?.cpu?.value || 0) > 80 ? "bg-red-500" : 
                (metricsData?.cpu?.value || 0) > 60 ? "bg-yellow-500" : 
                "bg-green-500"
              }
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsData?.memory?.value || 0}%
            </div>
            <Progress 
              value={metricsData?.memory?.value || 0} 
              className="h-2 mt-2"
              indicatorClassName={
                (metricsData?.memory?.value || 0) > 80 ? "bg-red-500" : 
                (metricsData?.memory?.value || 0) > 60 ? "bg-yellow-500" : 
                "bg-green-500"
              }
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsData?.disk?.value || 0}%
            </div>
            <Progress 
              value={metricsData?.disk?.value || 0} 
              className="h-2 mt-2"
              indicatorClassName={
                (metricsData?.disk?.value || 0) > 80 ? "bg-red-500" : 
                (metricsData?.disk?.value || 0) > 60 ? "bg-yellow-500" : 
                "bg-green-500"
              }
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsData?.network?.value || 0} Mbps
            </div>
            <Progress 
              value={(metricsData?.network?.value || 0) / 2} 
              className="h-2 mt-2"
              indicatorClassName="bg-blue-500"
            />
          </CardContent>
        </Card>
      </div>

      {/* Chart Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cpu">CPU</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="disk">Disk</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <CpuIcon className="mr-2 h-5 w-5" /> CPU Usage
                </CardTitle>
                <CardDescription>
                  CPU utilization over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cpuData}>
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'CPU Usage']}
                      labelFormatter={(label) => formatDate(label as string)}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <HardDrive className="mr-2 h-5 w-5" /> Memory Usage
                </CardTitle>
                <CardDescription>
                  Memory utilization over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={memoryData}>
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Memory Usage']}
                      labelFormatter={(label) => formatDate(label as string)}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <DatabaseIcon className="mr-2 h-5 w-5" /> Disk Usage
                </CardTitle>
                <CardDescription>
                  Disk utilization over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={diskData}>
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Disk Usage']}
                      labelFormatter={(label) => formatDate(label as string)}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Network className="mr-2 h-5 w-5" /> Network Traffic
                </CardTitle>
                <CardDescription>
                  Network utilization over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={networkData}>
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} Mbps`, 'Network Traffic']}
                      labelFormatter={(label) => formatDate(label as string)}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="cpu">
          <Card>
            <CardHeader>
              <CardTitle>CPU Utilization</CardTitle>
              <CardDescription>
                Detailed CPU metrics over the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cpuData}>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'CPU Usage']}
                    labelFormatter={(label) => formatDate(label as string)}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="memory">
          <Card>
            <CardHeader>
              <CardTitle>Memory Utilization</CardTitle>
              <CardDescription>
                Detailed memory metrics over the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={memoryData}>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Memory Usage']}
                    labelFormatter={(label) => formatDate(label as string)}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Similar tabs for other metrics */}
        <TabsContent value="disk">
          <Card>
            <CardHeader>
              <CardTitle>Disk Utilization</CardTitle>
              <CardDescription>
                Detailed disk usage metrics over the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Disk Usage Warning</AlertTitle>
                <AlertDescription>
                  Some partitions are approaching capacity limits
                </AlertDescription>
              </Alert>
              
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={diskData}>
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Disk Usage']}
                      labelFormatter={(label) => formatDate(label as string)}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="network">
          <Card>
            <CardHeader>
              <CardTitle>Network Metrics</CardTitle>
              <CardDescription>
                Detailed network traffic metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={networkData}>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} Mbps`, 'Network Traffic']}
                    labelFormatter={(label) => formatDate(label as string)}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Service Metrics</CardTitle>
              <CardDescription>
                Performance metrics for individual services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Core Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">98.5%</div>
                    <div className="text-xs text-muted-foreground">Uptime</div>
                    <Progress value={98.5} className="h-2 mt-2" />
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="flex justify-between items-center w-full text-xs">
                      <span className="text-muted-foreground">Response Time: 120ms</span>
                      <div className="flex items-center text-green-500">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        <span>Healthy</span>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">API Gateway</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">99.2%</div>
                    <div className="text-xs text-muted-foreground">Uptime</div>
                    <Progress value={99.2} className="h-2 mt-2" />
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="flex justify-between items-center w-full text-xs">
                      <span className="text-muted-foreground">Response Time: 85ms</span>
                      <div className="flex items-center text-green-500">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        <span>Healthy</span>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Database</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">99.7%</div>
                    <div className="text-xs text-muted-foreground">Uptime</div>
                    <Progress value={99.7} className="h-2 mt-2" />
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="flex justify-between items-center w-full text-xs">
                      <span className="text-muted-foreground">Query Time: 45ms</span>
                      <div className="flex items-center text-green-500">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        <span>Healthy</span>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}