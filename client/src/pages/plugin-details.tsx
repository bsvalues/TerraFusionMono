import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PuzzleIcon, 
  PlayIcon, 
  SquareIcon, 
  RefreshCwIcon, 
  Settings2Icon, 
  BarChart2Icon,
  HelpCircleIcon,
  UsersIcon,
  FileTextIcon
} from 'lucide-react';

// Define types for plugin data
interface PluginData {
  name: string;
  status: string;
  version: string;
  author: string;
  description: string;
  lastUpdated: string;
  documentationUrl: string;
  usageCount: number;
}

export default function PluginDetailsPage() {
  const [, params] = useRoute('/plugins/:name');
  const pluginName = params?.name || 'unknown';

  // Fetch plugin details
  const { data: pluginData, isLoading } = useQuery({
    queryKey: [`/api/plugins/by-name/${pluginName}`],
    retry: false,
  });

  // Use default values if the API response is empty or undefined
  const defaultPlugin: PluginData = {
    name: pluginName,
    status: 'active',
    version: '1.0.0',
    author: 'TerraFusion',
    description: 'Plugin description not available',
    lastUpdated: new Date().toISOString(),
    documentationUrl: '#',
    usageCount: 0,
  };
  
  const plugin: PluginData = pluginData ? { ...defaultPlugin, ...pluginData } : defaultPlugin;

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
          <PuzzleIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">{plugin.name}</h1>
          <div className="flex gap-2 items-center">
            <Badge variant={plugin.status === 'active' ? 'outline' : 'secondary'} 
                  className={plugin.status === 'active' ? 'bg-green-100 text-green-800' : ''}>
              {plugin.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
            <span className="text-sm text-muted-foreground">v{plugin.version}</span>
            <span className="text-sm text-muted-foreground">by {plugin.author}</span>
          </div>
        </div>
        <div className="ml-auto space-x-2">
          {plugin.status === 'active' ? (
            <Button variant="outline" className="gap-2">
              <SquareIcon className="h-4 w-4" />
              Disable
            </Button>
          ) : (
            <Button className="gap-2">
              <PlayIcon className="h-4 w-4" />
              Enable
            </Button>
          )}
          <Button variant="outline" className="gap-2">
            <RefreshCwIcon className="h-4 w-4" />
            Update
          </Button>
          <Button variant="outline" className="gap-2">
            <Settings2Icon className="h-4 w-4" />
            Configure
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <p className="text-muted-foreground">{plugin.description}</p>
      </div>

      <Tabs defaultValue="overview" className="mb-10">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
                <CardDescription>Current plugin status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">
                  {plugin.status === 'active' ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-red-600">Inactive</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Last updated: {new Date(plugin.lastUpdated).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Usage</CardTitle>
                <CardDescription>How often this plugin is used</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{plugin.usageCount || 0} calls</div>
                <p className="text-sm text-muted-foreground mt-2">
                  In the last 30 days
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Dependencies</CardTitle>
                <CardDescription>Required plugins and services</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>terrafusion-core</li>
                  <li>database-service</li>
                  <li>worker-node</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="documentation">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Plugin Documentation</CardTitle>
                <CardDescription>How to use this plugin</CardDescription>
              </div>
              <Button size="sm" variant="outline" className="gap-2">
                <HelpCircleIcon className="h-4 w-4" />
                View Full Documentation
              </Button>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <h3>Quick Start</h3>
                <p>
                  This plugin provides functionality for {plugin.name}. To get started,
                  make sure the plugin is enabled and properly configured.
                </p>
                
                <h4>API Examples</h4>
                <pre className="bg-slate-100 p-3 rounded-md">
                  <code>{`
// Example code for using the ${plugin.name} plugin
import { ${plugin.name} } from 'terrafusion-plugins';

// Initialize the plugin
const plugin = new ${plugin.name}({
  apiKey: process.env.${plugin.name.toUpperCase()}_API_KEY
});

// Use the plugin
const result = await plugin.process({
  input: 'Your input data here'
});
                  `}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>Plugin usage over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <BarChart2Icon className="h-16 w-16 text-muted-foreground/30" />
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-slate-100 rounded-lg">
                  <div className="text-2xl font-semibold">{plugin.usageCount || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Calls</div>
                </div>
                <div className="p-4 bg-slate-100 rounded-lg">
                  <div className="text-2xl font-semibold">12ms</div>
                  <div className="text-sm text-muted-foreground">Avg. Response Time</div>
                </div>
                <div className="p-4 bg-slate-100 rounded-lg">
                  <div className="text-2xl font-semibold">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="gap-2">
                <FileTextIcon className="h-4 w-4" />
                Export Usage Report
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Plugin Settings</CardTitle>
              <CardDescription>Configure plugin settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">API Key</label>
                  <div className="flex">
                    <input 
                      type="password" 
                      value="●●●●●●●●●●●●●●●●●●●●"
                      disabled
                      className="flex-1 p-2 border rounded-l-md bg-slate-50"
                    />
                    <Button variant="outline" className="rounded-l-none">
                      Update
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Throttling</label>
                  <select className="w-full p-2 border rounded-md">
                    <option>No throttling</option>
                    <option>10 requests per second</option>
                    <option>100 requests per minute</option>
                    <option>1000 requests per hour</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Access Control</label>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="gap-2">
                      <UsersIcon className="h-4 w-4" />
                      Manage Access
                    </Button>
                    <span className="text-sm text-muted-foreground">3 users have access</span>
                  </div>
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