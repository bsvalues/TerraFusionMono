import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * A server-side job to refresh materialized views periodically
 * This ensures materialized views contain relatively recent data while 
 * maintaining the performance benefits of pre-computed results
 */
export async function scheduleRefreshMaterializedViews() {
  try {
    console.log('Setting up materialized view refresh job');
    
    // Schedule materialized view refresh at regular intervals
    setInterval(async () => {
      try {
        console.log('Refreshing materialized views');
        
        // Call refresh function
        await db.execute(sql`SELECT refresh_materialized_views()`);
        
        console.log('Materialized views refreshed successfully');
      } catch (error) {
        console.error('Error refreshing materialized views:', error);
      }
    }, 1000 * 60 * 15); // Refresh every 15 minutes
    
    // Also refresh immediately on startup
    await db.execute(sql`SELECT refresh_materialized_views()`);
    console.log('Initial materialized view refresh completed');
  } catch (error) {
    console.error('Error setting up materialized view refresh job:', error);
  }
}