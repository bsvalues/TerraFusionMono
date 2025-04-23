import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface Plugin {
  id: number;
  name: string;
  version: string;
  description: string;
  status: string;
}

interface PluginStatusProps {
  plugins?: {
    plugins: Plugin[];
    coreVersion: string;
  };
  isLoading: boolean;
}

export default function PluginStatus({ plugins, isLoading }: PluginStatusProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const coreVersion = plugins?.coreVersion || "1.0.0";
  const pluginsList = plugins?.plugins || [];
  
  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/10 text-success';
      case 'beta':
        return 'bg-warning/10 text-warning';
      case 'disabled':
        return 'bg-gray-500/10 text-gray-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };
  
  // Handle plugin action
  const handlePluginAction = async (pluginId: number, action: 'enable' | 'disable' | 'update') => {
    const plugin = pluginsList.find(p => p.id === pluginId);
    if (!plugin) return;
    
    try {
      await apiRequest('POST', `/api/plugins/${pluginId}/${action}`, {});
      
      toast({
        title: `Plugin ${action === 'enable' ? 'enabled' : action === 'disable' ? 'disabled' : 'updated'}`,
        description: `The ${plugin.name} plugin was successfully ${action === 'enable' ? 'enabled' : action === 'disable' ? 'disabled' : 'updated'}.`,
      });
      
      // Refresh plugins data
      queryClient.invalidateQueries({ queryKey: ['/api/plugins'] });
    } catch (error) {
      toast({
        title: `Failed to ${action} plugin`,
        description: error instanceof Error ? error.message : `An error occurred while ${action}ing the plugin.`,
        variant: "destructive",
      });
    }
  };
  
  // Handle add plugin
  const handleAddPlugin = () => {
    toast({
      title: "Add Plugin",
      description: "The plugin installation interface is not yet implemented.",
    });
  };

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900">Plugin Status</h2>
      <Card className="mt-3">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            {isLoading ? (
              <>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-24" />
              </>
            ) : (
              <>
                <span className="text-sm font-medium text-gray-900">Core Version: {coreVersion}</span>
                <Button size="sm" onClick={handleAddPlugin}>
                  Add Plugin
                </Button>
              </>
            )}
          </div>
          
          <div className="space-y-3">
            {isLoading ? (
              // Loading placeholders
              Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-200">
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <div className="flex items-center">
                    <Skeleton className="h-6 w-16 mr-4" />
                    <Skeleton className="h-6 w-6" />
                  </div>
                </div>
              ))
            ) : (
              // Plugins list
              pluginsList.map((plugin) => (
                <div key={plugin.id} className="flex items-center justify-between py-2 border-b border-gray-200">
                  <div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{plugin.name}</span>
                      <span className="ml-2 text-xs text-gray-500">v{plugin.version}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {plugin.description}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(plugin.status)}`}>
                      {plugin.status.charAt(0).toUpperCase() + plugin.status.slice(1)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-4 h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {plugin.status !== 'active' && (
                          <DropdownMenuItem onClick={() => handlePluginAction(plugin.id, 'enable')}>
                            Enable
                          </DropdownMenuItem>
                        )}
                        {plugin.status !== 'disabled' && (
                          <DropdownMenuItem onClick={() => handlePluginAction(plugin.id, 'disable')}>
                            Disable
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handlePluginAction(plugin.id, 'update')}>
                          Check for updates
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
            
            {/* No plugins message */}
            {!isLoading && pluginsList.length === 0 && (
              <div className="py-4 text-center text-sm text-gray-500">
                No plugins installed
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
