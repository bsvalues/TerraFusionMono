import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '@terrafusion/schema';
import { logger } from '../utils/logger';
import ws from 'ws';

// Configure WebSocket for Neon database
neonConfig.webSocketConstructor = ws;

// Fastify plugin to set up database
const databasePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Create drizzle instance
    const db = drizzle(pool, { schema });
    
    // Add database to fastify instance
    fastify.decorate('db', db);
    fastify.decorate('pool', pool);

    // Close pool on fastify close
    fastify.addHook('onClose', async (instance) => {
      logger.info('Closing database pool');
      await instance.pool.end();
    });

    // Health check for database
    const healthCheckQuery = 'SELECT current_timestamp as timestamp, pg_is_in_recovery() as is_in_recovery';
    const { rows } = await pool.query(healthCheckQuery);
    logger.info('Database connection established', { timestamp: rows[0].timestamp });
    
  } catch (err) {
    logger.error('Failed to initialize database connection', err);
    throw err;
  }
};

export const setupDatabase = fastifyPlugin(databasePlugin);

// Types for fastify instance with database
declare module 'fastify' {
  interface FastifyInstance {
    db: ReturnType<typeof drizzle<typeof schema>>;
    pool: Pool;
  }
}