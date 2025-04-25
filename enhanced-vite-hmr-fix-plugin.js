/**
 * Enhanced Vite HMR Fix Plugin for Replit
 * 
 * This plugin configures Vite's HMR to work correctly in the Replit environment.
 * It's designed to be used as a custom plugin in vite.config.js/ts.
 * 
 * Features:
 * - Configures Vite server to listen on all interfaces
 * - Sets up HMR to work with Replit domains
 * - Injects client-side WebSocket fix script
 * - Handles various Replit environment types (Replit, Nix, Janeway)
 * - Provides detailed logs for debugging
 */

// Helper function to detect if we're in a Replit environment
function isReplitEnvironment() {
  return (
    process.env.REPL_ID !== undefined ||
    process.env.REPL_SLUG !== undefined ||
    process.env.REPLIT_PROFILE !== undefined ||
    (process.env.REPLIT_DOMAINS && process.env.REPLIT_DOMAINS !== "[]") ||
    process.env.REPLIT_ENVIRONMENT === 'janeway'
  );
}

// Helper function to get the Replit hostname
function getReplitHostname() {
  // First check REPLIT_DOMAINS environment variable (new Replit)
  if (process.env.REPLIT_DOMAINS && process.env.REPLIT_DOMAINS !== "[]") {
    try {
      // Parse the JSON array of domains
      const domains = JSON.parse(process.env.REPLIT_DOMAINS);
      if (domains && domains.length > 0) {
        return domains[0];
      }
    } catch (e) {
      console.error("Error parsing REPLIT_DOMAINS:", e);
    }
  }
  
  // Check if we're in the Janeway environment
  if (process.env.REPLIT_ENVIRONMENT === 'janeway') {
    // The hostname is complex in Janeway, so we'll use a placeholder
    // The client-side fix will handle the actual conversion
    return 'janeway.replit.dev';
  }
  
  // Check for old-style Replit domain (.repl.co)
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    return `${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
  }
  
  // Nix environment check
  if (process.env.REPL_SLUG && process.env.REPL_ID) {
    return `${process.env.REPL_SLUG}.id.replit.dev`;
  }
  
  return null;
}

export default function enhancedViteHmrFixPlugin(options = {}) {
  const isReplit = isReplitEnvironment();
  const hostname = getReplitHostname();
  const verbose = options.verbose || false;
  
  // Determine if we're in the Janeway environment
  const isJaneway = process.env.REPLIT_ENVIRONMENT === 'janeway';
  
  return {
    name: 'enhanced-vite-hmr-fix-for-replit',
    
    configureServer(server) {
      if (!isReplit) return;
      
      // Log info about the environment
      console.log('\n🚀 Enhanced Vite HMR Fix Plugin for Replit');
      console.log(`🔍 Replit environment detected (${process.env.REPL_ID || 'unknown'})`);
      
      if (isJaneway) {
        console.log('🧪 Janeway environment detected');
      }
      
      if (hostname) {
        console.log(`🌐 Using hostname: ${hostname}`);
      } else {
        console.warn('⚠️ Could not determine Replit hostname, HMR may not work correctly');
      }
      
      // Override the original listen method
      const originalListen = server.listen.bind(server);
      server.listen = async (...args) => {
        // Always bind to 0.0.0.0 on Replit to allow external connections
        server.config.server.host = '0.0.0.0';
        
        // Disable strictPort to allow alternative port if the default is already in use
        server.config.server.strictPort = false;
        
        // Configure HMR for Replit
        if (!server.config.server.hmr || typeof server.config.server.hmr === 'boolean') {
          server.config.server.hmr = {};
        }
        
        // Apply the HMR configuration based on environment
        if (isJaneway) {
          // Janeway environment needs special handling
          console.log('[enhanced-vite-hmr-fix] Applying Janeway HMR configuration');
          server.config.server.hmr.host = undefined; // Let the client handle it
          server.config.server.hmr.clientPort = undefined; // Use the same port as the server
          server.config.server.hmr.protocol = 'wss'; // Always use secure WebSockets
        } else if (hostname) {
          // Standard Replit environment
          console.log(`[enhanced-vite-hmr-fix] Applying Replit HMR configuration with host: ${hostname}`);
          server.config.server.hmr.host = hostname;
          server.config.server.hmr.clientPort = 443; // Use HTTPS port for WebSocket
          server.config.server.hmr.protocol = 'wss'; // Use secure WebSocket
        } else {
          // Fallback configuration
          console.warn('[enhanced-vite-hmr-fix] Using fallback HMR configuration');
          server.config.server.hmr.host = 'localhost'; 
        }
        
        // Enable auto-fixing of HMR connections
        server.config.server.hmr.path = '/__vite_hmr';
        server.config.server.hmr.overlay = true;
        
        // Call the original listen method with our new configuration
        return originalListen(...args);
      };
      
      // Override WebSocketServer options if needed
      const originalWebSocketServer = server.ws.on.bind(server.ws);
      server.ws.on = function(event, fn) {
        if (event === 'connection') {
          if (verbose) {
            console.log('[enhanced-vite-hmr-fix] Patching WebSocket connection handler');
          }
          
          return originalWebSocketServer(event, function(socket, req) {
            if (verbose) {
              console.log(`[enhanced-vite-hmr-fix] WebSocket connection from ${req.socket.remoteAddress}`);
            }
            return fn(socket, req);
          });
        }
        return originalWebSocketServer(event, fn);
      };
      
      // Log middleware for debugging
      if (verbose) {
        server.middlewares.use((req, res, next) => {
          console.log(`[enhanced-vite-hmr-fix] ${req.method} ${req.url}`);
          next();
        });
      }
    },
    
    transformIndexHtml(html) {
      if (!isReplit) return html;
      
      // Path to the client-side fix script
      const scriptPath = isJaneway
        ? "/improved-vite-hmr-fix.js"
        : "/vite-hmr-fix.js";
      
      const scriptTag = `<script src="${scriptPath}"></script>`;
      
      // Check if the script tag is already injected
      if (html.includes(scriptTag) || html.includes('/vite-hmr-fix.js') || html.includes('/improved-vite-hmr-fix.js')) {
        return html;
      }
      
      // Add metdata for Replit environment
      let metaTag = '';
      if (hostname) {
        metaTag = `<meta name="vite-hmr-hostname" content="${hostname}">`;
      }
      
      // Inject both tags before the closing head tag
      return html.replace('</head>', `${metaTag}${scriptTag}</head>`);
    },
    
    config(config) {
      if (!isReplit) return config;
      
      // Configure server for Replit
      config.server = config.server || {};
      config.server.hmr = config.server.hmr || {};
      
      // Always listen on all interfaces in Replit
      config.server.host = '0.0.0.0';
      
      // Handle different Replit environments
      if (isJaneway) {
        // Janeway needs special handling - the client-side fix handles most of it
        config.server.hmr.clientPort = undefined; // Let the client decide
        config.server.hmr.port = undefined; // Use the same port as the server
        config.server.hmr.protocol = 'wss'; // Always use secure WebSockets
      } else if (hostname) {
        // Standard Replit environment
        config.server.hmr.host = hostname;
        config.server.hmr.clientPort = 443; // Use HTTPS port for WebSocket
        config.server.hmr.protocol = 'wss'; // Use secure WebSocket
      } else {
        // Fallback configuration
        config.server.hmr.host = 'localhost';
        console.warn('[enhanced-vite-hmr-fix] Using fallback HMR configuration, may not work in Replit');
      }
      
      // Add cors options to handle cross-origin requests
      config.server.cors = true;
      
      // Log the configuration if verbose
      if (verbose) {
        console.log('[enhanced-vite-hmr-fix] Vite Configuration:', JSON.stringify(config.server, null, 2));
      }
      
      return config;
    },
  };
}