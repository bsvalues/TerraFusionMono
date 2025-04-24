import { FastifyInstance } from 'fastify';
import { logger } from '../utils/logger';

/**
 * Configure application plugins
 * This function registers all necessary plugins for the application
 */
export async function configurePlugins(server: FastifyInstance): Promise<void> {
  logger.info('Configuring application plugins');
  
  // Register plugin handlers
  server.register(require('./plugin-registry'));
  
  // Future plugins will be registered here:
  // - Authentication/Authorization
  // - WebSocket handling
  // - Metrics collection
  // - Plugin virtualization/sandboxing
  
  logger.info('Application plugins configured successfully');
}