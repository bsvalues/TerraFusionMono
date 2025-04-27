#!/usr/bin/env tsx
/**
 * TerraFusion Gateway Configuration Utility
 * 
 * This utility script manages the Apollo Federation Gateway configuration.
 * It allows adding, removing, enabling, and disabling subgraphs.
 * 
 * Usage:
 *   ./update-gateway-config.ts list
 *   ./update-gateway-config.ts add <name> <url> [enabled]
 *   ./update-gateway-config.ts remove <name>
 *   ./update-gateway-config.ts enable <name>
 *   ./update-gateway-config.ts disable <name>
 *   ./update-gateway-config.ts health
 */

import { 
  getSubgraphs, 
  addSubgraph, 
  removeSubgraph, 
  toggleSubgraphStatus,
  checkSubgraphsHealth
} from './apps/core-gateway/src/utils/subgraph-manager';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Print usage
function printUsage() {
  console.log(`
${colors.bright}TerraFusion Gateway Configuration Utility${colors.reset}

${colors.cyan}Usage:${colors.reset}
  ./update-gateway-config.ts list
  ./update-gateway-config.ts add <name> <url> [enabled]
  ./update-gateway-config.ts remove <name>
  ./update-gateway-config.ts enable <name>
  ./update-gateway-config.ts disable <name>
  ./update-gateway-config.ts health

${colors.cyan}Examples:${colors.reset}
  ./update-gateway-config.ts add user-service http://localhost:4001/graphql
  ./update-gateway-config.ts remove user-service
  ./update-gateway-config.ts disable user-service
`);
}

// List all subgraphs
function listSubgraphs() {
  const subgraphs = getSubgraphs();
  
  if (subgraphs.length === 0) {
    console.log(`${colors.yellow}No subgraphs configured${colors.reset}`);
    return;
  }
  
  console.log(`${colors.bright}Configured Subgraphs:${colors.reset}`);
  console.log('-'.repeat(80));
  console.log(`${colors.bright}Name                URL                                     Status${colors.reset}`);
  console.log('-'.repeat(80));
  
  subgraphs.forEach(({ name, url, enabled }) => {
    const status = enabled 
      ? `${colors.green}Enabled${colors.reset}`
      : `${colors.red}Disabled${colors.reset}`;
    
    // Pad the name and URL fields
    const paddedName = name.padEnd(20);
    const paddedUrl = url.padEnd(40);
    
    console.log(`${paddedName} ${paddedUrl} ${status}`);
  });
}

// Check health of all enabled subgraphs
async function checkHealth() {
  console.log(`${colors.bright}Checking Subgraph Health...${colors.reset}`);
  
  const results = await checkSubgraphsHealth();
  
  if (results.size === 0) {
    console.log(`${colors.yellow}No enabled subgraphs to check${colors.reset}`);
    return;
  }
  
  console.log('-'.repeat(50));
  console.log(`${colors.bright}Subgraph            Health Status${colors.reset}`);
  console.log('-'.repeat(50));
  
  let allHealthy = true;
  
  for (const [name, isHealthy] of results.entries()) {
    const status = isHealthy
      ? `${colors.green}Healthy${colors.reset}`
      : `${colors.red}Unhealthy${colors.reset}`;
    
    // Pad the name field
    const paddedName = name.padEnd(20);
    
    console.log(`${paddedName} ${status}`);
    
    if (!isHealthy) {
      allHealthy = false;
    }
  }
  
  console.log('-'.repeat(50));
  console.log(`${colors.bright}Overall Status:${colors.reset} ${allHealthy ? colors.green + 'All healthy' + colors.reset : colors.red + 'Some unhealthy' + colors.reset}`);
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }
  
  const command = args[0];
  
  switch (command) {
    case 'list':
      listSubgraphs();
      break;
      
    case 'add':
      if (args.length < 3) {
        console.error(`${colors.red}Error: 'add' command requires at least name and URL arguments${colors.reset}`);
        printUsage();
        process.exit(1);
      }
      
      const name = args[1];
      const url = args[2];
      const enabled = args[3] !== 'false'; // Default to true if not specified
      
      if (addSubgraph(name, url, enabled)) {
        console.log(`${colors.green}Successfully added subgraph "${name}"${colors.reset}`);
      } else {
        console.error(`${colors.red}Failed to add subgraph "${name}"${colors.reset}`);
        process.exit(1);
      }
      break;
      
    case 'remove':
      if (args.length < 2) {
        console.error(`${colors.red}Error: 'remove' command requires a name argument${colors.reset}`);
        printUsage();
        process.exit(1);
      }
      
      if (removeSubgraph(args[1])) {
        console.log(`${colors.green}Successfully removed subgraph "${args[1]}"${colors.reset}`);
      } else {
        console.error(`${colors.red}Failed to remove subgraph "${args[1]}"${colors.reset}`);
        process.exit(1);
      }
      break;
      
    case 'enable':
      if (args.length < 2) {
        console.error(`${colors.red}Error: 'enable' command requires a name argument${colors.reset}`);
        printUsage();
        process.exit(1);
      }
      
      if (toggleSubgraphStatus(args[1], true)) {
        console.log(`${colors.green}Successfully enabled subgraph "${args[1]}"${colors.reset}`);
      } else {
        console.error(`${colors.red}Failed to enable subgraph "${args[1]}"${colors.reset}`);
        process.exit(1);
      }
      break;
      
    case 'disable':
      if (args.length < 2) {
        console.error(`${colors.red}Error: 'disable' command requires a name argument${colors.reset}`);
        printUsage();
        process.exit(1);
      }
      
      if (toggleSubgraphStatus(args[1], false)) {
        console.log(`${colors.green}Successfully disabled subgraph "${args[1]}"${colors.reset}`);
      } else {
        console.error(`${colors.red}Failed to disable subgraph "${args[1]}"${colors.reset}`);
        process.exit(1);
      }
      break;
      
    case 'health':
      await checkHealth();
      break;
      
    default:
      console.error(`${colors.red}Error: Unknown command "${command}"${colors.reset}`);
      printUsage();
      process.exit(1);
  }
}

// Run main function
main().catch(error => {
  console.error(`${colors.red}Unhandled error:${colors.reset}`, error);
  process.exit(1);
});