import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { runSandbox, PluginQuotaError } from './sandbox';

// Test directory setup
const testDir = path.join(__dirname, '../../test-plugins');
const infiniteLoopPluginDir = path.join(testDir, 'infinite-loop-plugin');
const fsAccessPluginDir = path.join(testDir, 'fs-access-plugin');

// Create test plugins for sandbox testing
beforeAll(() => {
  // Create test directory if it doesn't exist
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // Create infinite loop plugin
  if (!fs.existsSync(infiniteLoopPluginDir)) {
    fs.mkdirSync(infiniteLoopPluginDir, { recursive: true });
    
    // Create manifest
    const infiniteLoopManifest = {
      name: 'infinite-loop-plugin',
      version: '1.0.0',
      description: 'A plugin that runs an infinite loop for testing timeout',
      entryPoint: 'index.js',
      quotas: {
        cpuMs: 500, // Short timeout for testing
        memKb: 128000
      }
    };
    
    fs.writeFileSync(
      path.join(infiniteLoopPluginDir, 'plugin.manifest.json'),
      JSON.stringify(infiniteLoopManifest, null, 2)
    );
    
    // Create plugin code with infinite loop
    const infiniteLoopCode = `
      module.exports = {
        startInfiniteLoop: function() {
          while(true) {
            // This should be stopped by the VM timeout
          }
        }
      };
    `;
    
    fs.writeFileSync(
      path.join(infiniteLoopPluginDir, 'index.js'),
      infiniteLoopCode
    );
  }
  
  // Create filesystem access plugin
  if (!fs.existsSync(fsAccessPluginDir)) {
    fs.mkdirSync(fsAccessPluginDir, { recursive: true });
    
    // Create manifest
    const fsAccessManifest = {
      name: 'fs-access-plugin',
      version: '1.0.0',
      description: 'A plugin that tries to access the filesystem',
      entryPoint: 'index.js',
      quotas: {
        cpuMs: 1000,
        memKb: 128000
      }
    };
    
    fs.writeFileSync(
      path.join(fsAccessPluginDir, 'plugin.manifest.json'),
      JSON.stringify(fsAccessManifest, null, 2)
    );
    
    // Create plugin code that tries to access the filesystem
    const fsAccessCode = `
      const fs = require('fs');
      
      module.exports = {
        readSystemFile: function() {
          try {
            // This should be blocked by sandbox
            return fs.readFileSync('/etc/passwd', 'utf-8');
          } catch (error) {
            return error.message;
          }
        }
      };
    `;
    
    fs.writeFileSync(
      path.join(fsAccessPluginDir, 'index.js'),
      fsAccessCode
    );
  }
});

// Clean up test files after tests
afterAll(() => {
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
  } catch (error) {
    console.error('Failed to clean up test directory:', error);
  }
});

describe('Plugin Sandbox', () => {
  it('should halt infinite loops that exceed CPU timeout', () => {
    const manifestPath = path.join(infiniteLoopPluginDir, 'plugin.manifest.json');
    
    expect(() => {
      const plugin = runSandbox(manifestPath);
      plugin.startInfiniteLoop();
    }).toThrow();
  });
  
  it('should block filesystem access', () => {
    const manifestPath = path.join(fsAccessPluginDir, 'plugin.manifest.json');
    
    const plugin = runSandbox(manifestPath);
    const result = plugin.readSystemFile();
    
    // The plugin should get an error when trying to access filesystem
    expect(result).toContain('Error');
  });
  
  it('should throw PluginQuotaError if manifest has no quotas', () => {
    // Create a temporary manifest with no quotas
    const tempDir = path.join(testDir, 'temp-plugin');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const badManifest = {
      name: 'no-quotas-plugin',
      version: '1.0.0',
      entryPoint: 'index.js',
      // No quotas defined
    };
    
    const manifestPath = path.join(tempDir, 'plugin.manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(badManifest, null, 2));
    
    // Create a dummy index.js
    fs.writeFileSync(path.join(tempDir, 'index.js'), 'module.exports = {};');
    
    expect(() => {
      runSandbox(manifestPath);
    }).toThrow(PluginQuotaError);
  });
});