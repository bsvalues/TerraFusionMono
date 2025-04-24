import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { systemMetrics } from '@terrafusion/schema';
import { logger } from '../utils/logger';
import os from 'os';

/**
 * System metrics routes
 */
const metricsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get overall system health and metrics
  fastify.get('/', async (request, reply) => {
    try {
      // Get system metrics
      const cpuUsage = Math.round(Math.random() * 100); // In a real implementation, use actual CPU usage
      const memoryUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const memoryPercent = Math.round((1 - freeMemory / totalMemory) * 100);
      
      // Get process uptime
      const uptime = process.uptime();
      
      // Get key metrics from database
      const recentMetrics = await fastify.db
        .select()
        .from(systemMetrics)
        .orderBy({ timestamp: 'desc' })
        .limit(10);
      
      // Determine CPU trend
      const cpuTrend = 'stable'; // Would calculate based on historical data
      
      return {
        status: 'Healthy',
        cpu: {
          value: cpuUsage,
          trend: cpuTrend,
        },
        memory: {
          used: formatBytes(memoryUsage.rss),
          total: formatBytes(totalMemory),
          percent: memoryPercent,
        },
        uptime: formatUptime(uptime),
        timestamp: new Date().toISOString(),
        recentMetrics,
      };
    } catch (err) {
      logger.error('Error fetching system metrics', err);
      return reply.status(500).send({ error: 'Failed to fetch system metrics' });
    }
  });

  // Get detailed metrics history
  fastify.get('/history', async (request, reply) => {
    try {
      const { service, timeRange, limit } = request.query as any;
      const queryLimit = limit ? parseInt(limit, 10) : 100;
      
      // Build query based on params
      let query = fastify.db.select().from(systemMetrics);
      
      if (service) {
        query = query.where({ service });
      }
      
      if (timeRange) {
        const startDate = new Date(timeRange.start);
        const endDate = new Date(timeRange.end);
        
        // This would use a proper date range query in a real implementation
      }
      
      const metrics = await query.limit(queryLimit);
      
      return {
        metrics,
        count: metrics.length,
      };
    } catch (err) {
      logger.error('Error fetching metrics history', err);
      return reply.status(500).send({ error: 'Failed to fetch metrics history' });
    }
  });

  // Record a new metric
  fastify.post('/', async (request, reply) => {
    try {
      const metricSchema = fastify.db.schema.insertMetricSchema.safeParse(request.body);
      
      if (!metricSchema.success) {
        return reply.status(400).send({
          error: 'Invalid metric data',
          details: metricSchema.error.format(),
        });
      }
      
      const [newMetric] = await fastify.db
        .insert(systemMetrics)
        .values(metricSchema.data)
        .returning();
      
      return newMetric;
    } catch (err) {
      logger.error('Error recording system metric', err);
      return reply.status(500).send({ error: 'Failed to record system metric' });
    }
  });

  // Get metrics for a specific service
  fastify.get('/service/:serviceName', async (request, reply) => {
    const { serviceName } = request.params as { serviceName: string };
    
    try {
      const serviceMetrics = await fastify.db
        .select()
        .from(systemMetrics)
        .where({ service: serviceName })
        .orderBy({ timestamp: 'desc' })
        .limit(50);
      
      return serviceMetrics;
    } catch (err) {
      logger.error(`Error fetching metrics for service ${serviceName}`, err);
      return reply.status(500).send({ error: 'Failed to fetch service metrics' });
    }
  });
};

// Helper functions
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);
  
  return parts.join(' ');
}

export default metricsRoutes;