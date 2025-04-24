import { scheduleRefreshMaterializedViews } from './refreshMaterializedViews';
import { monitorSlowQueries } from '../utils/queryMonitor';

/**
 * Initialize all scheduled jobs
 * This function should be called once during server startup
 */
export async function initializeJobs() {
  try {
    console.log('Initializing scheduled jobs');
    
    // Start materialized view refresh job
    await scheduleRefreshMaterializedViews();
    
    // Start query monitoring
    await monitorSlowQueries();
    
    // Add other scheduled jobs here
    
    console.log('All scheduled jobs initialized');
  } catch (error) {
    console.error('Error initializing jobs:', error);
    throw error;
  }
}