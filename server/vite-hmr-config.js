/**
 * Vite HMR Configuration for Replit
 * 
 * This module provides a configuration object for server/vite.ts
 * to ensure HMR works correctly in the Replit environment.
 */

const isReplit = process.env.REPL_ID && process.env.REPL_SLUG;

// Configuration specific to Replit environment
const replitConfig = {
  server: {
    hmr: {
      // Configure HMR for Replit environment
      host: isReplit 
        ? `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` 
        : undefined,
      clientPort: isReplit ? 443 : undefined,
      protocol: isReplit ? 'wss' : undefined,
    },
    // Always bind to 0.0.0.0 to allow connections from outside the container
    host: '0.0.0.0'
  },
  optimizeDeps: {
    // Disable dependency pre-bundling to avoid issues with the Replit sandbox
    disabled: isReplit
  }
};

// Export configuration for use in the server setup
module.exports = {
  replitConfig,
  isReplit
};