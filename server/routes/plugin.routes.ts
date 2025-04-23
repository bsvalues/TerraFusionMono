import { Router, Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { isAuthenticated } from '../middleware/auth';
import { Plugin, UserPlugin } from '@shared/schema';

const router = Router();

/**
 * Get all available plugins
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plugins = await storage.getPlugins();
    res.json(plugins);
  } catch (error) {
    next(error);
  }
});

/**
 * Get a plugin by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pluginId = parseInt(req.params.id);
    if (isNaN(pluginId)) {
      return res.status(400).json({ error: 'Invalid plugin ID' });
    }
    
    const plugin = await storage.getPlugin(pluginId);
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    
    res.json(plugin);
  } catch (error) {
    next(error);
  }
});

/**
 * Install a plugin for the current user
 */
router.post('/:id/install', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const pluginId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ error: 'User must be authenticated' });
    }
    
    if (isNaN(pluginId)) {
      return res.status(400).json({ error: 'Invalid plugin ID' });
    }
    
    // Check if plugin exists
    const plugin = await storage.getPlugin(pluginId);
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    
    // Check if user already has the plugin
    const hasPlugin = await storage.checkUserHasPlugin(userId, pluginId);
    if (hasPlugin) {
      return res.status(409).json({ error: 'Plugin already installed', plugin });
    }
    
    // Check if plugin has a product and if payment is required
    const pluginProducts = await storage.getPluginProductsByPluginId(pluginId);
    if (pluginProducts.length > 0) {
      // For simplicity, we'll assume free plugins for this implementation
      // In a real app, you'd check if the user has a valid subscription or has purchased the plugin
    }
    
    // Create user plugin entry
    const userPlugin = await storage.createUserPlugin({
      userId,
      pluginId,
      status: 'active',
      installDate: new Date(),
      version: plugin.version,
      settings: '{}', // Default empty settings
    });
    
    // Create plugin installation job
    await storage.createJob({
      type: 'plugin_install',
      status: 'pending',
      priority: 1,
      payload: JSON.stringify({
        userId,
        pluginId,
        userPluginId: userPlugin.id,
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Create audit log
    await storage.createLog({
      timestamp: new Date(),
      serviceName: 'plugin-manager',
      level: 'info',
      message: `User ${userId} installed plugin ${plugin.name} (${pluginId})`,
      details: JSON.stringify({
        userId,
        pluginId,
        pluginName: plugin.name,
        pluginVersion: plugin.version,
      }),
    });
    
    // Return success with plugin data
    res.status(201).json({
      message: 'Plugin installation initiated',
      plugin,
      userPlugin,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Uninstall a plugin for the current user
 */
router.delete('/:id/uninstall', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const pluginId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ error: 'User must be authenticated' });
    }
    
    if (isNaN(pluginId)) {
      return res.status(400).json({ error: 'Invalid plugin ID' });
    }
    
    // Check if plugin exists
    const plugin = await storage.getPlugin(pluginId);
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    
    // Check if user has the plugin
    const hasPlugin = await storage.checkUserHasPlugin(userId, pluginId);
    if (!hasPlugin) {
      return res.status(404).json({ error: 'Plugin not installed for this user' });
    }
    
    // Get user plugin record
    const userPlugins = await storage.getUserPlugins(userId);
    const userPlugin = userPlugins.find(up => up.pluginId === pluginId);
    
    if (!userPlugin) {
      return res.status(404).json({ error: 'User plugin record not found' });
    }
    
    // Update user plugin status to inactive
    await storage.updateUserPlugin(userPlugin.id, {
      status: 'inactive',
    });
    
    // Create plugin uninstallation job
    await storage.createJob({
      type: 'plugin_uninstall',
      status: 'pending',
      priority: 1,
      payload: JSON.stringify({
        userId,
        pluginId,
        userPluginId: userPlugin.id,
      }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Create audit log
    await storage.createLog({
      timestamp: new Date(),
      serviceName: 'plugin-manager',
      level: 'info',
      message: `User ${userId} uninstalled plugin ${plugin.name} (${pluginId})`,
      details: JSON.stringify({
        userId,
        pluginId,
        pluginName: plugin.name,
        pluginVersion: plugin.version,
      }),
    });
    
    // Return success
    res.json({
      message: 'Plugin uninstallation initiated',
      plugin,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get plugin configuration
 */
router.get('/:id/config', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const pluginId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ error: 'User must be authenticated' });
    }
    
    if (isNaN(pluginId)) {
      return res.status(400).json({ error: 'Invalid plugin ID' });
    }
    
    // Check if user has the plugin
    const hasPlugin = await storage.checkUserHasPlugin(userId, pluginId);
    if (!hasPlugin) {
      return res.status(404).json({ error: 'Plugin not installed for this user' });
    }
    
    // Get user plugin record
    const userPlugins = await storage.getUserPlugins(userId);
    const userPlugin = userPlugins.find(up => up.pluginId === pluginId);
    
    if (!userPlugin) {
      return res.status(404).json({ error: 'User plugin record not found' });
    }
    
    // Return plugin configuration
    res.json({
      settings: JSON.parse(userPlugin.settings || '{}'),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update plugin configuration
 */
router.put('/:id/config', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const pluginId = parseInt(req.params.id);
    const { settings } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'User must be authenticated' });
    }
    
    if (isNaN(pluginId)) {
      return res.status(400).json({ error: 'Invalid plugin ID' });
    }
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings format' });
    }
    
    // Check if user has the plugin
    const hasPlugin = await storage.checkUserHasPlugin(userId, pluginId);
    if (!hasPlugin) {
      return res.status(404).json({ error: 'Plugin not installed for this user' });
    }
    
    // Get user plugin record
    const userPlugins = await storage.getUserPlugins(userId);
    const userPlugin = userPlugins.find(up => up.pluginId === pluginId);
    
    if (!userPlugin) {
      return res.status(404).json({ error: 'User plugin record not found' });
    }
    
    // Update plugin settings
    const updatedUserPlugin = await storage.updateUserPlugin(userPlugin.id, {
      settings: JSON.stringify(settings),
      updatedAt: new Date(),
    });
    
    // Return updated configuration
    res.json({
      message: 'Plugin configuration updated',
      settings: JSON.parse(updatedUserPlugin?.settings || '{}'),
    });
  } catch (error) {
    next(error);
  }
});

export default router;