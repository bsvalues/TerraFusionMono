import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { logger } from '../utils/logger';
import { eq } from 'drizzle-orm';
import { plugins } from '@terrafusion/schema';

/**
 * Plugin Registry
 * 
 * This plugin handles the management of TerraFusion plugins,
 * including loading, registration, and version management.
 */
const pluginRegistryPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Skip if we're in test mode
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    logger.info('Initializing plugin registry');
    
    // Load all available plugins from database
    const availablePlugins = await fastify.db.select().from(plugins);
    logger.info(`Found ${availablePlugins.length} plugins in registry`);
    
    // Decorate fastify with plugin registry
    fastify.decorate('pluginRegistry', {
      plugins: availablePlugins,
      
      // Get plugin by ID
      getPluginById: async (id: number) => {
        return fastify.db.select().from(plugins).where(eq(plugins.id, id)).then(res => res[0]);
      },
      
      // Get plugin by name
      getPluginByName: async (name: string) => {
        return fastify.db.select().from(plugins).where(eq(plugins.name, name)).then(res => res[0]);
      },
      
      // Register a new plugin
      registerPlugin: async (pluginData: any) => {
        // In the future, this would validate the plugin,
        // check compatibility, and more
        logger.info(`Registering new plugin: ${pluginData.name}`);
        return fastify.db.insert(plugins).values(pluginData).returning();
      },
      
      // Activate a plugin
      activatePlugin: async (id: number) => {
        logger.info(`Activating plugin with id: ${id}`);
        return fastify.db
          .update(plugins)
          .set({ status: 'active' })
          .where(eq(plugins.id, id))
          .returning();
      },
      
      // Deactivate a plugin
      deactivatePlugin: async (id: number) => {
        logger.info(`Deactivating plugin with id: ${id}`);
        return fastify.db
          .update(plugins)
          .set({ status: 'disabled' })
          .where(eq(plugins.id, id))
          .returning();
      },
    });

  } catch (err) {
    logger.error('Failed to initialize plugin registry', err);
    throw err;
  }
};

// Export the plugin
export default fastifyPlugin(pluginRegistryPlugin);

// TypeScript declaration merging for fastify
declare module 'fastify' {
  interface FastifyInstance {
    pluginRegistry: {
      plugins: any[];
      getPluginById: (id: number) => Promise<any>;
      getPluginByName: (name: string) => Promise<any>;
      registerPlugin: (pluginData: any) => Promise<any>;
      activatePlugin: (id: number) => Promise<any>;
      deactivatePlugin: (id: number) => Promise<any>;
    }
  }
}