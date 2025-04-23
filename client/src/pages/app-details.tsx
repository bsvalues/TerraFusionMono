import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServerIcon, PlayIcon, SquareIcon, RefreshCwIcon, Settings2Icon, TerminalIcon, CodeIcon } from 'lucide-react';

// Define types for app data
interface AppData {
  name: string;
  status: string;
  version: string;
  lastStarted: string;
  cpu: string;
  memory: string;
}

export default function AppDetailsPage() {
  const [, params] = useRoute('/apps/:name');
  const appName = params?.name || 'unknown';

  // Fetch app details
  const { data: appData, isLoading } = useQuery({
    queryKey: [`/api/services/${appName}`],
    retry: false,
  });

  // Use default values if the API response is empty or undefined
  const defaultApp: AppData = {
    name: appName,
    status: 'unknown',
    version: '1.0.0',
    lastStarted: new Date().toISOString(),
    cpu: '0%',
    memory: '0MB',
  };
  
  const app: AppData = appData ? { ...defaultApp, ...appData } : defaultApp;

  // Get the appropriate icon for this app
  const getAppIcon = () => {
    switch (appName) {
      case 'terrafusion-core':
        return <ServerIcon className="h-6 w-6" />;
      case 'worker-node':
        return <TerminalIcon className="h-6 w-6" />;
      case 'worker-python':
        return <CodeIcon className="h-6 w-6" />;
      default:
        return <ServerIcon className="h-6 w-6" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container py-10 flex justify-center items-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-primary/10 rounded-lg">
          {getAppIcon()}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{app.name}</h1>
          <div className="flex gap-2 items-center">
            <Badge variant={app.status === 'running' ? 'outline' : 'secondary'} 
                  className={app.status === 'running' ? 'bg-green-100 text-green-800' : ''}>
              {app.status === 'running' ? 'Running' : 'Stopped'}
            </Badge>
            <span className="text-sm text-muted-foreground">v{app.version}</span>
          </div>
        </div>
        <div className="ml-auto space-x-2">
          {app.status === 'running' ? (
            <Button variant="outline" className="gap-2">
              <SquareIcon className="h-4 w-4" />
              Stop
            </Button>
          ) : (
            <Button className="gap-2">
              <PlayIcon className="h-4 w-4" />
              Start
            </Button>
          )}
          <Button variant="outline" className="gap-2">
            <RefreshCwIcon className="h-4 w-4" />
            Restart
          </Button>
          <Button variant="outline" className="gap-2">
            <Settings2Icon className="h-4 w-4" />
            Configure
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="mb-10">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
                <CardDescription>Current application status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {app.status === 'running' ? (
                    <span className="text-green-600">Running</span>
                  ) : (
                    <span className="text-red-600">Stopped</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Last started: {new Date(app.lastStarted).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>CPU Usage</CardTitle>
                <CardDescription>Current CPU utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{app.cpu || '0%'}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Memory Usage</CardTitle>
                <CardDescription>Current memory utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{app.memory || '0MB'}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Application Logs</CardTitle>
              <CardDescription>Recent logs from this application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-white p-4 rounded-md font-mono text-sm h-96 overflow-y-auto">
                <p className="opacity-70">[{new Date().toISOString()}] Application started</p>
                <p className="opacity-70">[{new Date().toISOString()}] Initializing services...</p>
                <p className="opacity-70">[{new Date().toISOString()}] Connected to database</p>
                <p className="opacity-70">[{new Date().toISOString()}] Server listening on port 5000</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm">Download Logs</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Application Metrics</CardTitle>
              <CardDescription>Performance metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                Metrics visualization will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle>Application Configuration</CardTitle>
              <CardDescription>Configure application settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Environment</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>Development</option>
                    <option>Staging</option>
                    <option>Production</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Auto-restart on failure</label>
                  <div className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span>Enable automatic restart</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Memory Limit</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>512MB</option>
                    <option>1GB</option>
                    <option>2GB</option>
                    <option>4GB</option>
                  </select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}