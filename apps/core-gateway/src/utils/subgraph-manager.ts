/**
 * Subgraph Manager Utility
 * 
 * This utility provides tools to manage the subgraph configuration
 * for the Apollo Federation Gateway.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface Subgraph {
  name: string;
  url: string;
  enabled: boolean;
}

export interface SubgraphsConfig {
  subgraphs: Subgraph[];
}

const CONFIG_PATH = path.resolve(__dirname, '../graphql/subgraphs.config.json');

/**
 * Load the subgraphs configuration from the JSON file
 */
export function loadSubgraphsConfig(): SubgraphsConfig {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      const defaultConfig: SubgraphsConfig = {
        subgraphs: [
          {
            name: 'terraagent',
            url: 'http://localhost:4001/graphql',
            enabled: true
          }
        ]
      };
      
      // Create directory if it doesn't exist
      const configDir = path.dirname(CONFIG_PATH);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      // Write default config
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    }
    
    const configData = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(configData) as SubgraphsConfig;
  } catch (error) {
    console.error('Failed to load subgraphs config:', error);
    return { subgraphs: [] };
  }
}

/**
 * Save the subgraphs configuration to the JSON file
 */
export function saveSubgraphsConfig(config: SubgraphsConfig): boolean {
  try {
    // Create directory if it doesn't exist
    const configDir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Write config
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save subgraphs config:', error);
    return false;
  }
}

/**
 * Add a new subgraph to the configuration
 */
export function addSubgraph(name: string, url: string, enabled = true): boolean {
  try {
    const config = loadSubgraphsConfig();
    
    // Check if the subgraph already exists
    const existingIndex = config.subgraphs.findIndex(sg => sg.name === name);
    if (existingIndex >= 0) {
      // Update existing subgraph
      config.subgraphs[existingIndex] = { name, url, enabled };
    } else {
      // Add new subgraph
      config.subgraphs.push({ name, url, enabled });
    }
    
    return saveSubgraphsConfig(config);
  } catch (error) {
    console.error('Failed to add subgraph:', error);
    return false;
  }
}

/**
 * Remove a subgraph from the configuration
 */
export function removeSubgraph(name: string): boolean {
  try {
    const config = loadSubgraphsConfig();
    
    // Filter out the subgraph
    config.subgraphs = config.subgraphs.filter(sg => sg.name !== name);
    
    return saveSubgraphsConfig(config);
  } catch (error) {
    console.error('Failed to remove subgraph:', error);
    return false;
  }
}

/**
 * Enable or disable a subgraph
 */
export function toggleSubgraphStatus(name: string, enabled: boolean): boolean {
  try {
    const config = loadSubgraphsConfig();
    
    // Find the subgraph
    const subgraph = config.subgraphs.find(sg => sg.name === name);
    if (!subgraph) {
      console.error(`Subgraph "${name}" not found`);
      return false;
    }
    
    // Update the status
    subgraph.enabled = enabled;
    
    return saveSubgraphsConfig(config);
  } catch (error) {
    console.error('Failed to toggle subgraph status:', error);
    return false;
  }
}

/**
 * Get all subgraphs with their status
 */
export function getSubgraphs(): Subgraph[] {
  try {
    const config = loadSubgraphsConfig();
    return config.subgraphs;
  } catch (error) {
    console.error('Failed to get subgraphs:', error);
    return [];
  }
}

/**
 * Get all enabled subgraphs
 */
export function getEnabledSubgraphs(): Subgraph[] {
  try {
    const config = loadSubgraphsConfig();
    return config.subgraphs.filter(sg => sg.enabled);
  } catch (error) {
    console.error('Failed to get enabled subgraphs:', error);
    return [];
  }
}

/**
 * Check health of all enabled subgraphs
 */
export async function checkSubgraphsHealth(): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();
  const enabledSubgraphs = getEnabledSubgraphs();
  
  await Promise.all(
    enabledSubgraphs.map(async ({ name, url }) => {
      try {
        // Use health endpoint
        const healthUrl = url.replace('graphql', 'health/ready');
        const response = await fetch(healthUrl, { 
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        results.set(name, response.ok);
      } catch (error) {
        results.set(name, false);
      }
    })
  );
  
  return results;
}