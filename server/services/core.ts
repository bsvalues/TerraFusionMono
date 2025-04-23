import { storage } from "../storage";
import { Service } from "@shared/schema";

/**
 * Core service for managing system services
 */
class CoreService {
  /**
   * Get all services with their statuses
   */
  async getServices(): Promise<Service[]> {
    return await storage.getServices();
  }
  
  /**
   * Restart a specific service
   */
  async restartService(serviceId: number): Promise<Service | undefined> {
    // Get the service first
    const service = await storage.getService(serviceId);
    if (!service) {
      throw new Error(`Service with ID ${serviceId} not found`);
    }
    
    // Update the service status to restarting
    await storage.updateService(serviceId, { status: "restarting" });
    
    // In a real implementation, this would actually restart the service
    // For now, we'll simulate the restart by updating the status after a delay
    setTimeout(async () => {
      try {
        await storage.updateService(serviceId, { 
          status: "running", 
          startedAt: new Date(),
          memory: Math.floor(Math.random() * 500) + 50, // Random memory usage between 50-550 MB
          cpu: Math.floor(Math.random() * 20) + 1 // Random CPU usage between 1-20%
        });
        
        // Log the restart
        await storage.createLog({
          level: "INFO",
          service: service.name,
          message: `Service restarted successfully`
        });
      } catch (error) {
        // Log the error
        await storage.createLog({
          level: "ERROR",
          service: service.name,
          message: `Failed to restart service: ${error instanceof Error ? error.message : String(error)}`
        });
        
        // Update service status to error
        await storage.updateService(serviceId, { status: "error" });
      }
    }, 2000);
    
    // Return the service with restarting status
    return { ...service, status: "restarting" };
  }
  
  /**
   * Stop a specific service
   */
  async stopService(serviceId: number): Promise<Service | undefined> {
    // Get the service first
    const service = await storage.getService(serviceId);
    if (!service) {
      throw new Error(`Service with ID ${serviceId} not found`);
    }
    
    // Update the service status to stopping
    await storage.updateService(serviceId, { status: "stopping" });
    
    // In a real implementation, this would actually stop the service
    // For now, we'll simulate the stop by updating the status after a delay
    setTimeout(async () => {
      try {
        await storage.updateService(serviceId, { 
          status: "stopped", 
          memory: 0,
          cpu: 0
        });
        
        // Log the stop
        await storage.createLog({
          level: "INFO",
          service: service.name,
          message: `Service stopped successfully`
        });
      } catch (error) {
        // Log the error
        await storage.createLog({
          level: "ERROR",
          service: service.name,
          message: `Failed to stop service: ${error instanceof Error ? error.message : String(error)}`
        });
        
        // Update service status to error
        await storage.updateService(serviceId, { status: "error" });
      }
    }, 2000);
    
    // Return the service with stopping status
    return { ...service, status: "stopping" };
  }
  
  /**
   * Restart all services
   */
  async restartAllServices(): Promise<{ success: boolean, message: string }> {
    // Get all services
    const services = await storage.getServices();
    
    // Restart each service that's not already restarting
    for (const service of services) {
      if (service.status !== "restarting" && service.status !== "stopping") {
        await this.restartService(service.id);
      }
    }
    
    return { success: true, message: `Restarting ${services.length} services` };
  }
  
  /**
   * Initialize default services if none exist
   */
  async initializeDefaultServices(): Promise<void> {
    const services = await storage.getServices();
    
    if (services.length === 0) {
      // Create default services
      const defaultServices = [
        { name: "terrafusion-core", status: "running", startedAt: new Date(), memory: 256, cpu: 12 },
        { name: "worker-node", status: "running", startedAt: new Date(), memory: 128, cpu: 8 },
        { name: "worker-python", status: "running", startedAt: new Date(), memory: 192, cpu: 5 },
        { name: "postgres", status: "running", startedAt: new Date(), memory: 512, cpu: 10 },
        { name: "redis", status: "running", startedAt: new Date(), memory: 64, cpu: 2 }
      ];
      
      for (const service of defaultServices) {
        await storage.createService(service);
      }
    }
  }
}

export const coreService = new CoreService();
