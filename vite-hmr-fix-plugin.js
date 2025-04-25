/**
 * Vite HMR Fix Plugin for Replit
 * 
 * This plugin configures Vite's HMR to work correctly in the Replit environment.
 * It's designed to be used as a custom plugin in vite.config.js/ts.
 */

export default function viteHmrFixPlugin() {
  // Check for Replit environment
  const isReplit = process.env.REPL_ID || 
                  process.env.REPLIT_ENVIRONMENT || 
                  process.env.REPL_SLUG || 
                  process.env.REPL_OWNER;

  return {
    name: 'vite-hmr-fix-plugin',
    
    // This hook runs during server configuration
    configureServer(server) {
      if (isReplit) {
        console.log('[vite-hmr-fix-plugin] Detected Replit environment');
        const originalListen = server.listen.bind(server);
        
        // Override the server.listen method to set HMR options
        server.listen = async (...args) => {
          // Always bind to 0.0.0.0 on Replit to allow external connections
          server.config.server.host = '0.0.0.0';
          
          // Disable strictPort to allow alternative port if the default is already in use
          server.config.server.strictPort = false;
          
          // Configure HMR for Replit
          if (!server.config.server.hmr || typeof server.config.server.hmr === 'boolean') {
            server.config.server.hmr = {};
          }
          
          // Get Replit domain
          let hmrHost;
          if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
            // Classic Replit environment
            hmrHost = `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
          } else if (process.env.REPL_ID) {
            // Modern Replit environment with deployment domains
            hmrHost = `${process.env.REPL_ID}.id.repl.co`;
          } else {
            // Fallback to default
            hmrHost = 'localhost';
          }
          
          console.log(`[vite-hmr-fix-plugin] Applying Replit HMR configuration with host: ${hmrHost}`);
          
          // Apply the HMR configuration
          server.config.server.hmr.host = hmrHost;
          server.config.server.hmr.clientPort = 443;
          server.config.server.hmr.protocol = 'wss';
          
          // Enable auto-fixing of HMR connections
          server.config.server.hmr.path = '/__vite_hmr';
          server.config.server.hmr.overlay = true;
          
          // Call the original listen method with our new configuration
          return originalListen(...args);
        };
      }
    },
    
    // Inject our client-side fix script into the HTML
    transformIndexHtml(html) {
      if (isReplit) {
        // Add the vite-hmr-fix.js script to the HTML if not already present
        if (!html.includes('vite-hmr-fix.js')) {
          const scriptTag = `<script src="/vite-hmr-fix.js"></script>`;
          return html.replace('</head>', `${scriptTag}\n</head>`);
        }
      }
      return html;
    }
  };
}