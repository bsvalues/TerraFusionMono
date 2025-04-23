import * as path from 'path';
import * as fs from 'fs';
import { runSandbox, PluginManifest, PluginQuotaError } from './sandbox';

// Define plugin interface
export interface Plugin {
  name: string;
  version: string;
  description?: string;
  exports: any;
  manifest: PluginManifest;
}

// Plugin registry to store loaded plugins
const pluginRegistry = new Map<string, Plugin>();

/**
 * Load a plugin from the given directory
 * @param pluginDir Path to the plugin directory
 */
export function loadPlugin(pluginDir: string): Plugin {
  const manifestPath = path.join(pluginDir, 'plugin.manifest.json');
  
  // Check if manifest exists
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Plugin manifest not found at ${manifestPath}`);
  }
  
  try {
    // Read and parse the manifest
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent) as PluginManifest;
    
    // Validate required fields
    if (!manifest.name || !manifest.version || !manifest.entryPoint) {
      throw new Error('Invalid plugin manifest: missing required fields');
    }
    
    // Ensure quotas are defined
    if (!manifest.quotas?.cpuMs || !manifest.quotas?.memKb) {
      throw new PluginQuotaError('Plugin must specify CPU and memory quotas');
    }
    
    // Run the plugin in the sandbox instead of using require()
    const pluginExports = runSandbox(manifestPath);
    
    // Create the plugin object
    const plugin: Plugin = {
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      exports: pluginExports,
      manifest: manifest
    };
    
    // Register the plugin
    pluginRegistry.set(manifest.name, plugin);
    
    return plugin;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load plugin: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get a plugin by name
 * @param name Plugin name
 */
export function getPlugin(name: string): Plugin | undefined {
  return pluginRegistry.get(name);
}

/**
 * Get all loaded plugins
 */
export function getAllPlugins(): Plugin[] {
  return Array.from(pluginRegistry.values());
}

/**
 * Load all plugins from a directory
 * @param pluginsDir Path to the plugins directory
 */
export function loadAllPlugins(pluginsDir: string): Plugin[] {
  if (!fs.existsSync(pluginsDir)) {
    console.warn(`Plugins directory not found: ${pluginsDir}`);
    return [];
  }
  
  const plugins: Plugin[] = [];
  
  // Read all subdirectories in the plugins directory
  const items = fs.readdirSync(pluginsDir, { withFileTypes: true });
  for (const item of items) {
    if (item.isDirectory()) {
      try {
        const plugin = loadPlugin(path.join(pluginsDir, item.name));
        plugins.push(plugin);
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Error loading plugin ${item.name}: ${error.message}`);
        }
      }
    }
  }
  
  return plugins;
}

// Export the main functions
export default {
  loadPlugin,
  getPlugin,
  getAllPlugins,
  loadAllPlugins
};