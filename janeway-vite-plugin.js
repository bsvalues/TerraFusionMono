/**
 * Janeway-Specific Vite HMR Fix Plugin
 * 
 * This plugin is specifically designed for Replit's Janeway environment
 * to solve WebSocket connection issues with Vite's Hot Module Replacement.
 */

// Detect if we're in a Janeway environment
function isJanewayEnvironment() {
  return process.env.REPLIT_ENVIRONMENT === 'janeway' || 
         (process.env.REPL_ID && process.env.REPLIT_ENVIRONMENT);
}

// Helper to extract domain information
function getJanewayDomain() {
  if (process.env.REPLIT_DOMAINS) {
    try {
      const domains = JSON.parse(process.env.REPLIT_DOMAINS);
      if (domains && domains.length > 0) {
        return domains[0];
      }
    } catch (e) {
      console.error("Error parsing REPLIT_DOMAINS:", e);
    }
  }
  
  if (process.env.REPL_ID) {
    return `${process.env.REPL_ID}.id.replit.dev`;
  }
  
  return null;
}

export default function janewayVitePlugin(options = {}) {
  const isJaneway = isJanewayEnvironment();
  const domain = getJanewayDomain();
  const verbose = options.verbose || false;
  
  return {
    name: 'janeway-vite-plugin',
    
    configureServer(server) {
      if (!isJaneway) {
        console.log('[janeway-vite-plugin] Not in Janeway environment, plugin disabled');
        return;
      }
      
      // Log environment info
      console.log('\n🚀 Janeway Vite Plugin Activated');
      console.log(`🔍 Janeway environment detected (${process.env.REPL_ID || 'unknown'})`);
      
      if (domain) {
        console.log(`🌐 Using domain: ${domain}`);
      } else {
        console.warn('⚠️ Could not determine Janeway domain, HMR may not work correctly');
      }
      
      // Override listen method to customize server configuration
      const originalListen = server.listen.bind(server);
      server.listen = async (...args) => {
        // Always bind to 0.0.0.0 on Janeway
        server.config.server.host = '0.0.0.0';
        
        // Disable strictPort to allow alternative port if the default is already in use
        server.config.server.strictPort = false;
        
        // Configure HMR
        if (!server.config.server.hmr || typeof server.config.server.hmr === 'boolean') {
          server.config.server.hmr = {};
        }
        
        // Special HMR configuration for Janeway
        console.log('[janeway-vite-plugin] Applying Janeway HMR configuration');
        
        // Don't set host/clientPort - let the client-side fix handle it
        server.config.server.hmr.host = undefined;
        server.config.server.hmr.clientPort = undefined;
        server.config.server.hmr.protocol = 'wss';
        
        // Detailed path to avoid conflicts
        server.config.server.hmr.path = '/__vite_hmr';
        
        // Always show HMR connection status
        server.config.server.hmr.overlay = true;
        
        if (verbose) {
          console.log('[janeway-vite-plugin] Server configuration:', 
                     JSON.stringify(server.config.server, null, 2));
        }
        
        // Call the original listen method with the new configuration
        return originalListen(...args);
      };
      
      // Add middleware to debug requests when verbose
      if (verbose) {
        server.middlewares.use((req, res, next) => {
          console.log(`[janeway-vite-plugin] ${req.method} ${req.url}`);
          next();
        });
      }
      
      // Fix WebSocket server options
      const originalWebSocketServer = server.ws.on.bind(server.ws);
      server.ws.on = function(event, fn) {
        if (event === 'connection') {
          if (verbose) {
            console.log('[janeway-vite-plugin] Patching WebSocket connection handler');
          }
          
          return originalWebSocketServer(event, function(socket, req) {
            if (verbose) {
              console.log(`[janeway-vite-plugin] WebSocket connection from ${req.socket.remoteAddress}`);
            }
            return fn(socket, req);
          });
        }
        return originalWebSocketServer(event, fn);
      };
    },
    
    transformIndexHtml(html) {
      if (!isJaneway) return html;
      
      // Check if the launcher script or any HMR fix script is already injected
      if (html.includes('vite-hmr-launcher.js') || 
          html.includes('janeway-vite-hmr-fix.js') || 
          html.includes('improved-vite-hmr-fix.js') || 
          html.includes('vite-hmr-fix.js')) {
        return html;
      }
      
      // Create meta tag with Janeway domain info if available
      let metaTag = '';
      if (domain) {
        metaTag = `<meta name="vite-hmr-hostname" content="${domain}">\n`;
      }
      
      // Use the launcher script to automatically select the right fix
      const scriptTag = `<script src="/vite-hmr-launcher.js"></script>`;
      
      // Inject meta tag and script before the closing head tag
      return html.replace('</head>', `${metaTag}${scriptTag}</head>`);
    },
    
    config(config) {
      if (!isJaneway) return config;
      
      // Configure for Janeway
      config.server = config.server || {};
      config.server.hmr = config.server.hmr || {};
      
      // Basic server config
      config.server.host = '0.0.0.0';
      config.server.cors = true;
      
      // Special HMR configuration for Janeway
      // Don't set host/clientPort - let the client-side fix handle it
      config.server.hmr.protocol = 'wss';
      
      return config;
    },
  };
}