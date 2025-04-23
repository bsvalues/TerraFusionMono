import { storage } from "../storage";
import { Plugin } from "@shared/schema";
import * as semver from "semver";

// Core version from the verifier
const CORE_VERSION = "1.0.0";

/**
 * Service for managing system plugins
 */
class PluginService {
  /**
   * Get all plugins with additional info
   */
  async getPlugins(): Promise<{ plugins: Plugin[], coreVersion: string }> {
    const plugins = await storage.getPlugins();
    return {
      plugins,
      coreVersion: CORE_VERSION
    };
  }
  
  /**
   * Enable a plugin
   */
  async enablePlugin(pluginId: number): Promise<Plugin | undefined> {
    // Get the plugin
    const plugin = await storage.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`);
    }
    
    // Verify compatibility with core version
    if (!semver.satisfies(CORE_VERSION, plugin.peerVersion)) {
      throw new Error(`Plugin is incompatible with core version ${CORE_VERSION}. Required: ${plugin.peerVersion}`);
    }
    
    // Update the plugin status
    return await storage.updatePlugin(pluginId, { status: "active" });
  }
  
  /**
   * Disable a plugin
   */
  async disablePlugin(pluginId: number): Promise<Plugin | undefined> {
    // Get the plugin
    const plugin = await storage.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`);
    }
    
    // Update the plugin status
    return await storage.updatePlugin(pluginId, { status: "disabled" });
  }
  
  /**
   * Update a plugin (simulated)
   */
  async updatePlugin(pluginId: number): Promise<Plugin | undefined> {
    // Get the plugin
    const plugin = await storage.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin with ID ${pluginId} not found`);
    }
    
    // In a real implementation, this would check for updates and update the plugin
    // For now, just log and return the current plugin
    await storage.createLog({
      level: "INFO",
      service: "plugin-system",
      message: `Checked for updates for plugin ${plugin.name}`
    });
    
    return plugin;
  }
  
  /**
   * Initialize default plugins if none exist
   */
  async initializeDefaultPlugins(): Promise<void> {
    const plugins = await storage.getPlugins();
    
    if (plugins.length === 0) {
      // Create default plugins
      const defaultPlugins = [
        { 
          name: "levy", 
          version: "1.2.0", 
          description: "Tax assessment calculation", 
          status: "active", 
          peerVersion: ">=1.0.0" 
        },
        { 
          name: "gis", 
          version: "1.0.4", 
          description: "Geospatial information system", 
          status: "active", 
          peerVersion: ">=1.0.0" 
        },
        { 
          name: "valuation", 
          version: "0.9.2", 
          description: "Property valuation engine", 
          status: "beta", 
          peerVersion: ">=1.0.0" 
        },
        { 
          name: "appeals", 
          version: "0.5.1", 
          description: "Appeals processing workflow", 
          status: "disabled", 
          peerVersion: ">=1.0.0" 
        },
        { 
          name: "public-portal", 
          version: "0.3.0", 
          description: "Public access portal", 
          status: "disabled", 
          peerVersion: ">=1.0.0" 
        }
      ];
      
      for (const plugin of defaultPlugins) {
        await storage.createPlugin(plugin);
      }
    }
  }
}

export const pluginService = new PluginService();
