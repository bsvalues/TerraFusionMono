import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { geocodeCalls, insertGeocodeCallSchema } from '@terrafusion/schema';
import { logger } from '../utils/logger';
import { GeocodeService } from '../services/geocode';

// Validate environment variables
if (!process.env.STRIPE_GEOCODE_PRICE) {
  logger.warn('STRIPE_GEOCODE_PRICE environment variable not set. Metered billing will not work properly.');
}

/**
 * Geocoding service routes
 */
const geocodeRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Initialize the geocode service
  const geocodeService = new GeocodeService();
  
  // Schema for geocode requests
  const geocodeRequestSchema = z.object({
    address: z.string().min(3).max(500),
    format: z.enum(['json', 'xml', 'csv']).default('json').optional(),
  });

  // Geocode an address
  fastify.post('/', async (request, reply) => {
    const parseResult = geocodeRequestSchema.safeParse(request.body);
    
    if (!parseResult.success) {
      return reply.status(400).send({ 
        error: 'Invalid request data', 
        details: parseResult.error.format() 
      });
    }

    const { address, format } = parseResult.data;
    const startTime = Date.now();
    let tenantId = 0; // Anonymous/public usage
    let success = false;
    
    try {
      // If authenticated, use the user's ID as tenant ID
      if (request.user) {
        tenantId = request.user.id;
      }
      
      // Call the geocoding service
      const geocodeResult = await geocodeService.geocodeAddress(address);
      success = true;
      
      // Record the geocode call
      const responseTime = Date.now() - startTime;
      await fastify.db.insert(geocodeCalls).values({
        tenantId,
        address,
        success: true,
        responseTime,
        chargeStatus: 'pending',
      });
      
      // Record usage for metered billing (if applicable)
      if (tenantId !== 0 && process.env.STRIPE_GEOCODE_PRICE) {
        try {
          await geocodeService.recordUsage(tenantId, 1);
        } catch (err) {
          logger.error('Failed to record usage for metered billing', err);
        }
      }
      
      return geocodeResult;
    } catch (err) {
      logger.error('Error geocoding address', err);
      success = false;
      
      // Record the failed geocode call
      try {
        const responseTime = Date.now() - startTime;
        await fastify.db.insert(geocodeCalls).values({
          tenantId,
          address,
          success: false,
          responseTime,
          chargeStatus: 'waived', // Don't charge for failed calls
        });
      } catch (recordErr) {
        logger.error('Failed to record geocode call', recordErr);
      }
      
      return reply.status(500).send({ 
        error: 'Geocoding failed', 
        message: err instanceof Error ? err.message : 'Unknown error' 
      });
    }
  });

  // Get geocode usage metrics
  fastify.get('/metrics', async (request, reply) => {
    try {
      // This should be protected by authentication
      if (!request.user) {
        return reply.status(401).send({ error: 'Authentication required' });
      }
      
      const tenantId = request.user.id;
      const metrics = await geocodeService.getUsageMetrics(tenantId);
      
      return metrics;
    } catch (err) {
      logger.error('Error fetching geocode metrics', err);
      return reply.status(500).send({ error: 'Failed to fetch geocode metrics' });
    }
  });

  // Batch geocode multiple addresses
  fastify.post('/batch', async (request, reply) => {
    const batchSchema = z.object({
      addresses: z.array(z.string()).min(1).max(100),
      format: z.enum(['json', 'xml', 'csv']).default('json').optional(),
    });
    
    const parseResult = batchSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ 
        error: 'Invalid batch request', 
        details: parseResult.error.format() 
      });
    }
    
    const { addresses, format } = parseResult.data;
    let tenantId = 0;
    
    // This endpoint requires authentication
    if (!request.user) {
      return reply.status(401).send({ error: 'Authentication required for batch geocoding' });
    }
    
    tenantId = request.user.id;
    
    try {
      const results = await geocodeService.batchGeocodeAddresses(addresses);
      
      // Record the batch geocode calls and usage
      const startTime = Date.now();
      const responseTime = Math.floor((Date.now() - startTime) / addresses.length);
      
      for (const address of addresses) {
        await fastify.db.insert(geocodeCalls).values({
          tenantId,
          address,
          success: true,
          responseTime,
          chargeStatus: 'pending',
        });
      }
      
      // Record batch usage for metered billing
      if (process.env.STRIPE_GEOCODE_PRICE) {
        try {
          await geocodeService.recordUsage(tenantId, addresses.length);
        } catch (err) {
          logger.error('Failed to record batch usage for metered billing', err);
        }
      }
      
      return results;
    } catch (err) {
      logger.error('Error performing batch geocode', err);
      return reply.status(500).send({ 
        error: 'Batch geocoding failed', 
        message: err instanceof Error ? err.message : 'Unknown error' 
      });
    }
  });
};

export default geocodeRoutes;