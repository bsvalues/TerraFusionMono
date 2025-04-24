import { FastifyInstance } from 'fastify';
import { logger } from '../utils/logger';

// Import route modules
import pluginRoutes from './plugins';
import geocodeRoutes from './geocode';
import marketplaceRoutes from './marketplace';
import authRoutes from './auth';
import metricsRoutes from './metrics';
import cropHealthRoutes from './crop-health';

/**
 * Register all API routes
 */
export async function configureRoutes(server: FastifyInstance): Promise<void> {
  logger.info('Configuring API routes');
  
  // Register API routes
  server.register(authRoutes, { prefix: '/api/auth' });
  server.register(pluginRoutes, { prefix: '/api/plugins' });
  server.register(geocodeRoutes, { prefix: '/api/geocode' });
  server.register(marketplaceRoutes, { prefix: '/api/marketplace' });
  server.register(metricsRoutes, { prefix: '/api/metrics' });
  server.register(cropHealthRoutes, { prefix: '/api/crop-health' });
  
  // Version route
  server.get('/api/version', async () => {
    return {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };
  });
  
  logger.info('API routes configured successfully');
}