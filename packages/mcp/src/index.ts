/**
 * TerraFusion Marketplace Contract Protocol (MCP)
 * 
 * This module defines the contract and interfaces for plugins in the TerraFusion marketplace.
 * It provides the foundation for plugin distribution, licensing, and integration.
 */
import { z } from 'zod';

/**
 * Plugin manifest schema
 * Defines the structure and requirements for a valid plugin
 */
export const pluginManifestSchema = z.object({
  name: z.string().min(1).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().max(500),
  author: z.string().min(1),
  license: z.string(),
  peerVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
  main: z.string(),
  dependencies: z.record(z.string()).optional(),
  engines: z.object({
    terrafusion: z.string(),
    node: z.string().optional(),
    python: z.string().optional(),
  }),
  capabilities: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
});

export type PluginManifest = z.infer<typeof pluginManifestSchema>;

/**
 * Plugin runtime environment
 */
export enum PluginRuntime {
  NODE = 'node',
  PYTHON = 'python',
  WASM = 'wasm',
}

/**
 * Plugin capability levels 
 */
export enum PluginCapabilityLevel {
  BASIC = 'basic',      // Basic API access, no system resources
  STANDARD = 'standard', // Limited system resource access
  ADVANCED = 'advanced', // Full system resource access
  ADMIN = 'admin',      // Administrative capabilities
}

/**
 * Plugin permission types
 */
export enum PluginPermission {
  READ_FILES = 'read:files',
  WRITE_FILES = 'write:files',
  READ_DB = 'read:database',
  WRITE_DB = 'write:database',
  NETWORK = 'network',
  EXECUTE_COMMANDS = 'execute:commands',
  ACCESS_USER_DATA = 'access:user-data',
}

/**
 * Plugin interface
 * The contract that all plugins must fulfill
 */
export interface IPlugin {
  // Core lifecycle methods
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  uninstall(): Promise<void>;
  
  // Configuration
  getConfig(): Record<string, any>;
  setConfig(config: Record<string, any>): Promise<void>;
  
  // Status
  getStatus(): Promise<PluginStatus>;
  
  // Capabilities
  getCapabilities(): string[];
  
  // Event handling
  onEvent(event: PluginEvent): Promise<void>;
}

/**
 * Plugin status
 */
export interface PluginStatus {
  active: boolean;
  health: 'healthy' | 'degraded' | 'error';
  message?: string;
  lastActive?: Date;
  metrics?: Record<string, any>;
}

/**
 * Plugin event
 */
export interface PluginEvent {
  type: string;
  source: string;
  timestamp: Date;
  data: any;
}

/**
 * Plugin sandbox configuration
 */
export interface PluginSandboxConfig {
  memoryLimit: number; // in MB
  timeoutMs: number;
  allowedModules: string[];
  allowedPermissions: PluginPermission[];
  networkAccess: boolean;
  fileSystemAccess: boolean;
}

/**
 * Default sandbox configuration
 */
export const DEFAULT_SANDBOX_CONFIG: PluginSandboxConfig = {
  memoryLimit: 512,
  timeoutMs: 60000,
  allowedModules: ['crypto', 'path'],
  allowedPermissions: [PluginPermission.READ_FILES, PluginPermission.READ_DB],
  networkAccess: false,
  fileSystemAccess: false,
};

/**
 * Plugin product pricing model
 */
export enum PricingModel {
  FREE = 'free',
  ONE_TIME = 'one-time',
  SUBSCRIPTION = 'subscription',
  USAGE_BASED = 'usage-based',
}

/**
 * Billing period
 */
export enum BillingPeriod {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

/**
 * License verification response
 */
export interface LicenseVerificationResult {
  isValid: boolean;
  expiresAt?: Date;
  features: string[];
  restrictions?: string[];
  message?: string;
}

/**
 * Plugin versioning utilities
 */
export class PluginVersion {
  /**
   * Check if a plugin version is compatible with the platform version
   */
  static isCompatible(pluginVersion: string, platformVersion: string): boolean {
    // Simple implementation - in reality would do proper semver comparison
    const [pluginMajor] = pluginVersion.split('.');
    const [platformMajor] = platformVersion.split('.');
    
    return pluginMajor === platformMajor;
  }
  
  /**
   * Compare two version strings
   * @returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
   */
  static compare(v1: string, v2: string): -1 | 0 | 1 {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < 3; i++) {
      if (parts1[i] < parts2[i]) return -1;
      if (parts1[i] > parts2[i]) return 1;
    }
    
    return 0;
  }
}

/**
 * Plugin loader interface
 */
export interface IPluginLoader {
  loadPlugin(pluginPath: string): Promise<IPlugin>;
  validateManifest(manifest: any): PluginManifest;
  createSandbox(config: Partial<PluginSandboxConfig>): any;
}

/**
 * Plugin manager interface
 */
export interface IPluginManager {
  installPlugin(pluginPath: string): Promise<string>;
  uninstallPlugin(pluginId: string): Promise<void>;
  enablePlugin(pluginId: string): Promise<void>;
  disablePlugin(pluginId: string): Promise<void>;
  getPlugin(pluginId: string): Promise<IPlugin | undefined>;
  listPlugins(): Promise<string[]>;
  getPluginStatus(pluginId: string): Promise<PluginStatus>;
}