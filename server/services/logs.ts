import { storage } from "../storage";
import { SystemLog, InsertLog } from "@shared/schema";

/**
 * Service for system logs
 */
class LogsService {
  /**
   * Get system logs with filtering
   */
  async getLogs(limit: number = 100, service?: string, level?: string): Promise<SystemLog[]> {
    return await storage.getLogs(limit, service, level);
  }
  
  /**
   * Log a system event
   */
  async logEvent(level: string, service: string, message: string): Promise<SystemLog> {
    return await storage.createLog({ level, service, message });
  }
  
  /**
   * Create a log entry directly from an object
   */
  async createLog(log: InsertLog): Promise<SystemLog> {
    return await storage.createLog(log);
  }
  
  /**
   * Initialize sample logs if none exist
   */
  async initializeSampleLogs(): Promise<void> {
    const logs = await storage.getLogs(1);
    
    if (logs.length === 0) {
      // Create sample logs
      const sampleLogs = [
        { level: "INFO", service: "terrafusion-core", message: "Server started on port 4000" },
        { level: "INFO", service: "terrafusion-core", message: "Connected to database tf_core" },
        { level: "INFO", service: "worker-node", message: "Starting job processor" },
        { level: "INFO", service: "worker-python", message: "Starting VACUUM scheduler" },
        { level: "WARN", service: "worker-node", message: "High memory usage detected (75%)" },
        { level: "ERROR", service: "worker-node", message: "Failed to process job id=15: Insufficient disk space" },
        { level: "INFO", service: "worker-node", message: "Job moved to DLQ: etlDLQ" },
        { level: "INFO", service: "terrafusion-core", message: "Plugin 'levy' loaded successfully" }
      ];
      
      // Add with timestamps spread out
      for (let i = 0; i < sampleLogs.length; i++) {
        const log = sampleLogs[i];
        // Set timestamps with each log 30 seconds apart, starting from 8 minutes ago
        const timestamp = new Date(Date.now() - ((sampleLogs.length - i) * 30 * 1000) - (8 * 60 * 1000));
        
        await storage.createLog({
          ...log,
          timestamp
        });
      }
    }
  }
}

export const logsService = new LogsService();
