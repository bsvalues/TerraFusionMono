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
        await storage.updateJob(jobId, { 
          status: "processing", 
          startedAt: new Date(),
          progress: 0
        });
        
        // Simulate progress updates
        let progress = 0;
        const progressInterval = setInterval(async () => {
          progress += 10;
          
          if (progress >= 100) {
            clearInterval(progressInterval);
            
            // Complete the job
            await storage.updateJob(jobId, { 
              status: "completed", 
              progress: 100,
              completedAt: new Date()
            });
            
            // Log the completion
            await storage.createLog({
              level: "INFO",
              service: job.worker || "job-system",
              message: `Job ${job.name} (ID: ${job.id}) completed successfully`
            });
          } else {
            // Update progress
            await storage.updateJob(jobId, { progress });
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
