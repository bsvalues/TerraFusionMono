import { storage } from "../storage";
import { Job, InsertJob } from "@shared/schema";

/**
 * Service for managing background jobs
 */
class JobService {
  /**
   * Get recent jobs
   */
  async getJobs(limit: number = 10): Promise<Job[]> {
    return await storage.getJobs(limit);
  }
  
  /**
   * Create a new job
   */
  async createJob(job: InsertJob): Promise<Job> {
    // Create the job
    const newJob = await storage.createJob(job);
    
    // In a real implementation, this would dispatch the job to the appropriate worker
    // For now, we'll simulate job processing
    this.simulateJobProcessing(newJob.id);
    
    return newJob;
  }
  
  /**
   * Simulate job processing (for demo purposes)
   */
  private async simulateJobProcessing(jobId: number): Promise<void> {
    // Get the job
    const job = await storage.getJob(jobId);
    if (!job) return;
    
    // Simulate starting the job after a delay
    setTimeout(async () => {
      try {
        // Update job to processing status
        const updatedJob = await storage.updateJob(jobId, { 
          status: "processing", 
          startedAt: new Date(),
          progress: 0
        });
        
        // Broadcast job started via WebSocket
        if ((global as any).broadcastWebSocketMessage && updatedJob) {
          (global as any).broadcastWebSocketMessage({
            type: 'job_update',
            job: updatedJob
          });
        }
        
        // If this is a plugin installation job, add more detailed status messages
        let statusMessages: string[] = [];
        if (job.worker === 'plugin-installer') {
          const pluginName = job.name.replace('Install plugin: ', '');
          statusMessages = [
            `Preparing to install ${pluginName}`,
            `Verifying plugin dependencies`,
            `Downloading plugin package`,
            `Extracting plugin files`,
            `Configuring plugin settings`,
            `Running plugin initialization`,
            `Updating system registry`,
            `Validating plugin installation`,
            `Finalizing installation`,
            `Installation complete`
          ];
        }
        
        // Simulate progress updates
        let progress = 0;
        const progressInterval = setInterval(async () => {
          progress += 10;
          
          // For plugin installer, add status message
          const additionalData: any = {};
          if (job.worker === 'plugin-installer' && statusMessages.length > 0) {
            const messageIndex = Math.min(Math.floor(progress / 10), statusMessages.length - 1);
            additionalData.statusMessage = statusMessages[messageIndex];
          }
          
          // Update job progress
          const progressUpdatedJob = await storage.updateJob(jobId, { 
            progress,
            ...additionalData
          });
          
          // Broadcast progress update
          if ((global as any).broadcastWebSocketMessage && progressUpdatedJob) {
            (global as any).broadcastWebSocketMessage({
              type: 'job_update',
              job: progressUpdatedJob
            });
          }
          
          if (progress >= 100) {
            clearInterval(progressInterval);
            
            // Complete the job
            const completedJob = await storage.updateJob(jobId, { 
              status: "completed", 
              progress: 100,
              completedAt: new Date()
            });
            
            // Broadcast job completed
            if ((global as any).broadcastWebSocketMessage && completedJob) {
              (global as any).broadcastWebSocketMessage({
                type: 'job_update',
                job: completedJob
              });
            }
            
            // Log the completion
            await storage.createLog({
              level: "INFO",
              service: job.worker || "job-system",
              message: `Job ${job.name} (ID: ${job.id}) completed successfully`
            });
            
            // For plugin installation, log additional message
            if (job.worker === 'plugin-installer') {
              const pluginName = job.name.replace('Install plugin: ', '');
              await storage.createLog({
                level: "INFO",
                service: "plugin-system",
                message: `Plugin ${pluginName} has been successfully installed and is ready to use`
              });
            }
          } else {
            // Update progress
            await storage.updateJob(jobId, { progress, ...additionalData });
          }
        }, 2000);
      } catch (error) {
        // Log the error
        await storage.createLog({
          level: "ERROR",
          service: job.worker || "job-system",
          message: `Failed to process job ${job.id}: ${error instanceof Error ? error.message : String(error)}`
        });
        
        // Update job status to failed
        await storage.updateJob(jobId, { 
          status: "failed", 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, 1000);
  }
  
  /**
   * Initialize default jobs if none exist
   */
  async initializeDefaultJobs(): Promise<void> {
    const jobs = await storage.getJobs();
    
    if (jobs.length === 0) {
      // Create some sample jobs
      const defaultJobs = [
        { name: "ETL Data Import", status: "processing", worker: "worker-node", progress: 45, startedAt: new Date(Date.now() - 2 * 60 * 1000) },
        { name: "Parcel Analysis", status: "queued", worker: "worker-python", queuedAt: new Date(Date.now() - 5 * 60 * 1000) },
        { name: "Database Backup", status: "failed", worker: "worker-node", error: "Insufficient disk space", startedAt: new Date(Date.now() - 10 * 60 * 1000) }
      ];
      
      for (const job of defaultJobs) {
        await storage.createJob(job);
      }
    }
  }
}

export const jobService = new JobService();
