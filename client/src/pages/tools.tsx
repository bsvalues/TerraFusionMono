import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Database, GitBranch, Terminal, Wrench } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState("system");
  
  const { data: services = [], isLoading: isLoadingServices } = useQuery<any[]>({
    queryKey: ["/api/services"],
    staleTime: 30000,
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tools</h1>
          <p className="text-muted-foreground mt-1">
            Manage and configure system tools and utilities
          </p>
        </div>
      </div>

      <Tabs defaultValue="system" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="system">System Tools</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="cli">CLI Tools</TabsTrigger>
          <TabsTrigger value="dev">Developer Tools</TabsTrigger>
        </TabsList>
        
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Tools</CardTitle>
              <CardDescription>
                Tools for managing and monitoring the TerraFusion system
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {services ? (
                services.map((service: any) => (
                  <Card key={service.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{service.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {service.description || 'System service'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="flex justify-between items-center">
                        <div className={`px-2 py-1 rounded-md text-xs ${
                          service.status === 'running' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' : 
                          service.status === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400' : 
                          'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400'
                        }`}>
                          {service.status}
                        </div>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No services found</AlertTitle>
                  <AlertDescription>
                    Unable to retrieve system services
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Tools</CardTitle>
              <CardDescription>
                Tools for managing and interacting with the database
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    <CardTitle className="text-base">Database Explorer</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Open Database Explorer
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <GitBranch className="h-4 w-4 mr-2" />
                    <CardTitle className="text-base">Migration Tool</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Manage Migrations
                  </Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cli" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Command Line Tools</CardTitle>
              <CardDescription>
                Access and run CLI tools for TerraFusion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <Terminal className="h-4 w-4 mr-2" />
                    <CardTitle className="text-base">Terminal</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-black text-green-400 p-4 rounded-md h-48 font-mono text-sm">
                    <div>TerraFusion CLI v1.2.3</div>
                    <div>Type 'help' to see available commands</div>
                    <div className="mt-2">$ _</div>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    Open in Full View
                  </Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dev" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Developer Tools</CardTitle>
              <CardDescription>
                Tools for development and debugging
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <Tool className="h-4 w-4 mr-2" />
                    <CardTitle className="text-base">API Explorer</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Open API Explorer
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <CardTitle className="text-base">Debug Console</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant="outline">
                    Open Debug Console
                  </Button>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}