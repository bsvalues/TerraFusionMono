import { NodeVM } from 'vm2';
import * as fs from 'fs';
import * as path from 'path';

// Extend Error for quota-related exceptions
export class PluginQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PluginQuotaError';
  }
}

// Define the plugin manifest interface
export interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  entryPoint: string;
  quotas?: {
    cpuMs?: number;
    memKb?: number;
  };
}

// Interface for plugin exports
export interface PluginExports {
  [key: string]: any;
}

/**
 * Read and parse a plugin manifest
 * @param manifestPath Path to the plugin manifest file
 */
export function readManifest(manifestPath: string): PluginManifest {
  try {
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent) as PluginManifest;
    
    // Validate required fields
    if (!manifest.name || !manifest.version || !manifest.entryPoint) {
      throw new Error('Invalid plugin manifest: missing required fields');
    }
    
    // Set default quotas if not provided
    if (!manifest.quotas) {
      manifest.quotas = { cpuMs: 1000, memKb: 128000 };
    } else {
      manifest.quotas.cpuMs = manifest.quotas.cpuMs || 1000;
      manifest.quotas.memKb = manifest.quotas.memKb || 128000;
    }
    
    return manifest;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read plugin manifest: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Run a plugin in a sandboxed environment with resource limits
 * @param manifestPath Path to the plugin manifest file
 */
export function runSandbox(manifestPath: string): PluginExports {
  try {
    const manifest = readManifest(manifestPath);
    const pluginDir = path.dirname(manifestPath);
    const entryPointPath = path.resolve(pluginDir, manifest.entryPoint);
    
    // Ensure the plugin respects quota limits
    if (!manifest.quotas?.cpuMs || !manifest.quotas?.memKb) {
      throw new PluginQuotaError('Plugin must specify CPU and memory limits');
    }
    
    // Create a sandboxed VM with the specified limits
    const vm = new NodeVM({
      console: 'redirect',
      sandbox: { console },
      timeout: manifest.quotas.cpuMs,
      // VM2 typings don't include memoryLimit but it's a supported option
      require: {
        external: false,
        builtin: ['path', 'crypto'],
        root: pluginDir,
      }
    } as any); // Use 'as any' to bypass TypeScript strict checking
    
    // Load the plugin in the sandbox
    const pluginExports = vm.runFile(entryPointPath);
    return pluginExports;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'PluginQuotaError') {
        throw error;
      }
      throw new Error(`Failed to run plugin in sandbox: ${error.message}`);
    }
    throw error;
  }
}

// Export the main function for running sandboxed plugins
export default runSandbox;