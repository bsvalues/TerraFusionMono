/**
 * Vite HMR Fix Plugin for Replit
 * 
 * This plugin configures Vite's HMR to work correctly in the Replit environment.
 * It's designed to be used as a custom plugin in vite.config.js/ts.
 */

export default function viteHmrFixPlugin() {
  const isReplit = process.env.REPL_ID && process.env.REPL_SLUG;

  return {
    name: 'vite-hmr-fix-plugin',
    
    // This hook runs during server configuration
    configureServer(server) {
      if (isReplit) {
        const originalListen = server.listen.bind(server);
        
        // Override the server.listen method to set HMR options
        server.listen = async (...args) => {
          // Always bind to 0.0.0.0 on Replit to allow external connections
          server.config.server.host = '0.0.0.0';
          
          // Configure HMR for Replit
          if (!server.config.server.hmr || typeof server.config.server.hmr === 'boolean') {
            server.config.server.hmr = {};
          }
          
          // Use the current Replit URL for WebSocket connections
          const replSlug = process.env.REPL_SLUG;
          const replOwner = process.env.REPL_OWNER;
          
          if (replSlug && replOwner) {
            console.log('[vite-hmr-fix-plugin] Applying Replit HMR configuration');
            server.config.server.hmr.host = `${replSlug}.${replOwner}.repl.co`;
            server.config.server.hmr.clientPort = 443;
            server.config.server.hmr.protocol = 'wss';
          }
          
          // Call the original listen method with our new configuration
          return originalListen(...args);
        };
      }
    },
    
    // Inject our client-side fix script into the HTML
    transformIndexHtml(html) {
      if (isReplit) {
        // We're already doing this via the script tag in index.html
        return html;
      }
      return html;
    }
  };
}