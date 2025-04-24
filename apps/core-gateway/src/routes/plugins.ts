import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { plugins, insertPluginSchema } from '@terrafusion/schema';
import { logger } from '../utils/logger';

/**
 * Plugin management routes
 */
const pluginRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get all plugins
  fastify.get('/', async (request, reply) => {
    try {
      const allPlugins = await fastify.db.select().from(plugins);
      return { plugins: allPlugins };
    } catch (err) {
      logger.error('Error fetching plugins', err);
      return reply.status(500).send({ error: 'Failed to fetch plugins' });
    }
  });

  // Get plugin by ID
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const plugin = await fastify.pluginRegistry.getPluginById(parseInt(id, 10));
      if (!plugin) {
        return reply.status(404).send({ error: 'Plugin not found' });
      }
      return plugin;
    } catch (err) {
      logger.error(`Error fetching plugin with id ${id}`, err);
      return reply.status(500).send({ error: 'Failed to fetch plugin' });
    }
  });

  // Create a new plugin
  fastify.post('/', async (request, reply) => {
    const schema = insertPluginSchema.safeParse(request.body);
    if (!schema.success) {
      return reply.status(400).send({ error: 'Invalid plugin data', details: schema.error });
    }

    try {
      const newPlugin = await fastify.pluginRegistry.registerPlugin(schema.data);
      return reply.status(201).send(newPlugin[0]);
    } catch (err) {
      logger.error('Error creating plugin', err);
      return reply.status(500).send({ error: 'Failed to create plugin' });
    }
  });

  // Update a plugin
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const updateSchema = z.object({
      name: z.string().optional(),
      version: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(['active', 'disabled', 'beta']).optional(),
      config: z.any().optional(),
    });

    const parseResult = updateSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({ error: 'Invalid update data', details: parseResult.error });
    }

    try {
      const existingPlugin = await fastify.pluginRegistry.getPluginById(parseInt(id, 10));
      if (!existingPlugin) {
        return reply.status(404).send({ error: 'Plugin not found' });
      }

      const [updatedPlugin] = await fastify.db
        .update(plugins)
        .set(parseResult.data)
        .where(eq(plugins.id, parseInt(id, 10)))
        .returning();

      return updatedPlugin;
    } catch (err) {
      logger.error(`Error updating plugin with id ${id}`, err);
      return reply.status(500).send({ error: 'Failed to update plugin' });
    }
  });

  // Activate a plugin
  fastify.post('/:id/activate', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const [activatedPlugin] = await fastify.pluginRegistry.activatePlugin(parseInt(id, 10));
      if (!activatedPlugin) {
        return reply.status(404).send({ error: 'Plugin not found' });
      }
      return { message: 'Plugin activated successfully', plugin: activatedPlugin };
    } catch (err) {
      logger.error(`Error activating plugin with id ${id}`, err);
      return reply.status(500).send({ error: 'Failed to activate plugin' });
    }
  });

  // Deactivate a plugin
  fastify.post('/:id/deactivate', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const [deactivatedPlugin] = await fastify.pluginRegistry.deactivatePlugin(parseInt(id, 10));
      if (!deactivatedPlugin) {
        return reply.status(404).send({ error: 'Plugin not found' });
      }
      return { message: 'Plugin deactivated successfully', plugin: deactivatedPlugin };
    } catch (err) {
      logger.error(`Error deactivating plugin with id ${id}`, err);
      return reply.status(500).send({ error: 'Failed to deactivate plugin' });
    }
  });

  // Delete a plugin
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const existingPlugin = await fastify.pluginRegistry.getPluginById(parseInt(id, 10));
      if (!existingPlugin) {
        return reply.status(404).send({ error: 'Plugin not found' });
      }

      await fastify.db
        .delete(plugins)
        .where(eq(plugins.id, parseInt(id, 10)));

      return { message: 'Plugin deleted successfully' };
    } catch (err) {
      logger.error(`Error deleting plugin with id ${id}`, err);
      return reply.status(500).send({ error: 'Failed to delete plugin' });
    }
  });
};

export default pluginRoutes;