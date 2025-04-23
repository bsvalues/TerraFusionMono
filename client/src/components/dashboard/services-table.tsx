import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface Service {
  id: number;
  name: string;
  status: string;
  startedAt?: string;
  memory?: number;
  cpu?: number;
}

interface ServicesTableProps {
  services?: Service[];
  isLoading: boolean;
}

export default function ServicesTable({ services = [], isLoading }: ServicesTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [actionInProgress, setActionInProgress] = useState<Record<string, boolean>>({});

  // Calculate uptime from startedAt
  const calculateUptime = (startedAt?: string) => {
    if (!startedAt) return "-";
    
    const start = new Date(startedAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  // Handle service action (restart/stop)
  const handleServiceAction = async (serviceId: number, action: 'restart' | 'stop') => {
    const serviceName = services.find(s => s.id === serviceId)?.name || 'Service';
    setActionInProgress({ ...actionInProgress, [serviceId]: true });
    
    try {
      await apiRequest('POST', `/api/services/${serviceId}/${action}`, {});
      
      toast({
        title: `${action === 'restart' ? 'Restarting' : 'Stopping'} ${serviceName}`,
        description: `Service ${action === 'restart' ? 'restart' : 'stop'} initiated successfully.`,
      });
      
      // Refresh services data
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
    } catch (error) {
      toast({
        title: `Failed to ${action} ${serviceName}`,
        description: error instanceof Error ? error.message : `An error occurred while ${action}ing the service.`,
        variant: "destructive",
      });
    } finally {
      setActionInProgress({ ...actionInProgress, [serviceId]: false });
    }
  };

  // Handle restart all services
  const handleRestartAll = async () => {
    try {
      await apiRequest('POST', '/api/services/restart-all', {});
      
      toast({
        title: "Restarting all services",
        description: "Service restart initiated successfully for all services.",
      });
      
      // Refresh services data
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
    } catch (error) {
      toast({
        title: "Failed to restart services",
        description: error instanceof Error ? error.message : "An error occurred while restarting services.",
        variant: "destructive",
      });
    }
  };

  // Create placeholder rows for loading state
  const placeholderRows = Array.from({ length: 5 }, (_, i) => (
    <TableRow key={`loading-${i}`}>
      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-8 w-24 ml-auto" />
      </TableCell>
    </TableRow>
  ));

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Services</h2>
        <Button onClick={handleRestartAll}>
          Restart All
        </Button>
      </div>
      <div className="mt-3 flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uptime</TableHead>
                    <TableHead>Memory</TableHead>
                    <TableHead>CPU</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? placeholderRows : (
                    services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            service.status === 'running' 
                              ? 'bg-success/10 text-success' 
                              : service.status === 'error'
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-warning/10 text-warning'
                          }`}>
                            {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {calculateUptime(service.startedAt)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {service.memory ? `${service.memory} MB` : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {service.cpu ? `${service.cpu}%` : "-"}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          <Button 
                            variant="ghost" 
                            className="text-primary hover:text-primary/80 mr-4"
                            onClick={() => handleServiceAction(service.id, 'restart')}
                            disabled={actionInProgress[service.id] || service.status === 'stopped'}
                          >
                            Restart
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="text-destructive hover:text-destructive/80"
                            onClick={() => handleServiceAction(service.id, 'stop')}
                            disabled={actionInProgress[service.id] || service.status === 'stopped'}
                          >
                            Stop
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
