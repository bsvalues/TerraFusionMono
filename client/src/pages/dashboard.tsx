import StatusOverview from "@/components/dashboard/status-overview";
import ServicesTable from "@/components/dashboard/services-table";
import JobsQueue from "@/components/dashboard/jobs-queue";
import SystemLogs from "@/components/dashboard/system-logs";
import AiProviderStatus from "@/components/dashboard/ai-provider-status";
import PluginStatus from "@/components/dashboard/plugin-status";
import SystemHealth from "@/components/dashboard/system-health";
import { useQuery } from "@tanstack/react-query";

export default function Dashboard() {
  // Fetch services data
  const { data: servicesData, isLoading: isLoadingServices } = useQuery({
    queryKey: ['/api/services'],
  });

  // Fetch system metrics data
  const { data: metricsData, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['/api/metrics'],
  });

  // Fetch jobs queue data
  const { data: jobsData, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['/api/jobs'],
  });

  // Fetch system logs
  const { data: logsData, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['/api/logs'],
  });

  // Fetch AI providers
  const { data: aiProvidersData, isLoading: isLoadingAiProviders } = useQuery({
    queryKey: ['/api/ai-providers'],
  });

  // Fetch plugins
  const { data: pluginsData, isLoading: isLoadingPlugins } = useQuery({
    queryKey: ['/api/plugins'],
  });

  // Fetch system health
  const { data: healthData, isLoading: isLoadingHealth } = useQuery({
    queryKey: ['/api/health'],
  });

  return (
    <div className="py-6">
      <div className="px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">System Dashboard</h1>
        
        {/* Status Overview Section */}
        <StatusOverview 
          metrics={metricsData} 
          isLoading={isLoadingMetrics} 
        />

        {/* Services Section */}
        <ServicesTable 
          services={servicesData} 
          isLoading={isLoadingServices} 
        />

        {/* Jobs Queue and System Logs */}
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
          <JobsQueue 
            jobs={jobsData} 
            isLoading={isLoadingJobs} 
          />
          <SystemLogs 
            logs={logsData} 
            isLoading={isLoadingLogs} 
          />
        </div>

        {/* AI Providers and Plugins */}
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
          <AiProviderStatus 
            providers={aiProvidersData} 
            isLoading={isLoadingAiProviders} 
          />
          <PluginStatus 
            plugins={pluginsData} 
            isLoading={isLoadingPlugins} 
          />
        </div>

        {/* System Health */}
        <SystemHealth 
          health={healthData} 
          isLoading={isLoadingHealth} 
        />
      </div>
    </div>
  );
}
