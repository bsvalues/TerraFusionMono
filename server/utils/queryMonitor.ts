import { sql } from 'drizzle-orm';
import { db } from '../db';
import { log } from '../vite';

/**
 * Monitors slow queries in the database
 * Helps identify performance bottlenecks in production
 */
export async function monitorSlowQueries() {
  try {
    log('Setting up slow query monitoring');
    
    // Create pgStatStatements extension if it doesn't exist
    await db.execute(sql`
      CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
    `);
    
    // Initialize the extension
    await db.execute(sql`
      SELECT pg_stat_statements_reset();
    `);
    
    // Set up periodic monitoring
    setInterval(async () => {
      try {
        // Query for slow queries (taking more than 100ms)
        const result = await db.execute(sql`
          SELECT 
            query,
            calls,
            total_exec_time / calls as avg_exec_time_ms,
            rows / calls as avg_rows,
            total_exec_time
          FROM pg_stat_statements
          WHERE total_exec_time / calls > 100
          ORDER BY total_exec_time DESC
          LIMIT 10;
        `);
        
        // Using result.rows to get the actual query results
        const slowQueries = result.rows || [];
        
        if (slowQueries.length > 0) {
          log('Detected slow queries:', 'warn');
          slowQueries.forEach((query: any, idx: number) => {
            const queryText = query.query ? query.query.toString().substring(0, 100) : 'Unknown query';
            const avgTime = query.avg_exec_time_ms ? Number(query.avg_exec_time_ms).toFixed(2) : 'unknown';
            log(`Slow Query #${idx + 1}: ${queryText}... - Avg time: ${avgTime}ms`, 'warn');
          });
        }
      } catch (error) {
        log(`Error monitoring slow queries: ${error}`, 'error');
      }
    }, 1000 * 60 * 60); // Check once per hour
    
    log('Slow query monitoring initialized');
  } catch (error) {
    log(`Error setting up query monitoring: ${error}`, 'error');
  }
}