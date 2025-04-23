import { storage } from "../storage";

/**
 * Service for system metrics
 */
class MetricsService {
  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<{
    status: string,
    cpu: { value: number },
    memory: { used: number, total: number }
  }> {
    // In a real implementation, this would get actual metrics from the system
    // For now, return simulated metrics
    
    // CPU usage - random between 30-70%
    const cpuValue = Math.floor(Math.random() * 40) + 30;
    
    // Memory usage - random between 2-4 GB out of 8 GB
    const memoryUsed = Math.floor((Math.random() * 2) + 2);
    const memoryTotal = 8;
    
    // System status - always healthy for demo
    const status = "Healthy";
    
    // Store the metric in the database
    await storage.createMetric({
      service: "system",
      name: "cpu_usage",
      value: cpuValue,
      unit: "percent"
    });
    
    await storage.createMetric({
      service: "system",
      name: "memory_usage",
      value: memoryUsed * 1024, // Convert to MB for storage
      unit: "MB"
    });
    
    return {
      status,
      cpu: { value: cpuValue },
      memory: { used: memoryUsed, total: memoryTotal }
    };
  }
  
  /**
   * Initialize AI providers if none exist
   */
  async initializeAiProviders(): Promise<void> {
    const providers = await storage.getAiProviders();
    
    if (providers.length === 0) {
      // Create default AI providers
      const defaultProviders = [
        { 
          name: "openai", 
          status: "active", 
          apiRate: 98,
          config: { model: "gpt-4" }
        },
        { 
          name: "anthropic", 
          status: "standby", 
          apiRate: 100,
          config: { model: "claude-3" }
        }
      ];
      
      for (const provider of defaultProviders) {
        await storage.createAiProvider(provider);
      }
    }
  }
}

export const metricsService = new MetricsService();
