/**
 * Vite HMR Configuration for Replit
 * 
 * This module provides a configuration object for server/vite.ts
 * to ensure HMR works correctly in the Replit environment.
 * Includes special handling for Janeway environment.
 */

const isReplit = process.env.REPL_ID && process.env.REPL_SLUG;

// Detect Janeway environment (AI Agent environment)
const isJaneway = process.env.REPLIT_ENVIRONMENT === 'janeway' || 
                  process.env.REPLIT_ENVIRONMENT === 'ai';

// Get the correct hostname based on environment
function getHostname() {
  // For Janeway environment
  if (isJaneway && process.env.REPLIT_DEPLOYMENT_ID) {
    return `${process.env.REPLIT_DEPLOYMENT_ID}-00-${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  }
  
  // For regular Replit environment
  if (isReplit) {
    return `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  }
  
  // For local development
  return undefined;
}

// Get protocol based on environment 
const protocol = isReplit || isJaneway ? 'wss' : undefined;

console.log(`Configuring Vite HMR for environment: ${isJaneway ? 'Janeway' : (isReplit ? 'Replit' : 'Local')}`);
console.log(`HMR Host: ${getHostname()}`);

// Configuration specific to Replit environment
const replitConfig = {
  server: {
    hmr: {
      // Configure HMR for current environment
      host: getHostname(),
      clientPort: isReplit || isJaneway ? 443 : undefined,
      protocol: protocol,
      // Increase timeout for Janeway environment which may be slower
      timeout: isJaneway ? 60000 : 30000,
      // Automatically restart if connection fails
      restart: true
    },
    // Always bind to 0.0.0.0 to allow connections from outside the container
    host: '0.0.0.0',
    // Set CORS headers 
    cors: true
  },
  optimizeDeps: {
    // Disable dependency pre-bundling to avoid issues with the sandbox
    disabled: isReplit || isJaneway
  }
};

// Export configuration for use in the server setup
module.exports = {
  replitConfig,
  isReplit,
  isJaneway
};