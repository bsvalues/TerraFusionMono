import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface LogEntry {
  id: number;
  timestamp: string;
  level: string;
  service: string;
  message: string;
}

interface SystemLogsProps {
  logs?: LogEntry[];
  isLoading: boolean;
}

export default function SystemLogs({ logs = [], isLoading }: SystemLogsProps) {
  const [serviceFilter, setServiceFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  
  // Get all unique services from logs
  const services = [...new Set(logs?.map(log => log.service) || [])];
  
  // Filter logs by service and level
  const filteredLogs = logs?.filter(log => {
    return (serviceFilter === "all" || log.service === serviceFilter) &&
           (levelFilter === "all" || log.level === levelFilter);
  }) || [];
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toISOString().replace('T', ' ').substr(0, 19);
  };
  
  // Get level color class
  const getLevelColorClass = (level: string) => {
    switch (level.toUpperCase()) {
      case 'INFO':
        return 'text-success';
      case 'WARN':
        return 'text-warning';
      case 'ERROR':
        return 'text-destructive';
      case 'DEBUG':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">System Logs</h2>
        <div className="flex space-x-2">
          <Select
            value={serviceFilter}
            onValueChange={setServiceFilter}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {services.map(service => (
                <SelectItem key={service} value={service}>{service}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={levelFilter}
            onValueChange={setLevelFilter}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="INFO">INFO</SelectItem>
              <SelectItem value="WARN">WARN</SelectItem>
              <SelectItem value="ERROR">ERROR</SelectItem>
              <SelectItem value="DEBUG">DEBUG</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Card className="mt-3">
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto font-mono text-xs">
            {isLoading ? (
              // Loading placeholders
              Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={`p-2 border-b border-gray-200 ${i % 2 === 0 ? 'bg-gray-50' : ''}`}>
                  <Skeleton className="h-4 w-full" />
                </div>
              ))
            ) : filteredLogs.length > 0 ? (
              // Log entries
              filteredLogs.map((log, index) => (
                <div key={log.id} className={`p-2 border-b border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                  <pre className="whitespace-pre-wrap break-all">
                    <span className="text-gray-500">[{formatTimestamp(log.timestamp)}]</span>{' '}
                    <span className={`font-medium ${getLevelColorClass(log.level)}`}>{log.level}</span>{' '}
                    <span className="text-gray-900">[{log.service}]:</span>{' '}
                    {log.message}
                  </pre>
                </div>
              ))
            ) : (
              // No logs message
              <div className="p-4 text-center text-gray-500">
                No logs found matching the current filters
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
