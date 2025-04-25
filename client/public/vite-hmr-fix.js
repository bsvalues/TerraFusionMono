/**
 * Vite HMR Fix for Replit
 * 
 * This script fixes WebSocket connection issues in Replit for Vite.
 * It intercepts WebSocket connections and rewrites the URLs to use
 * the correct Replit domain instead of localhost.
 */

console.log('[vite-hmr-fix] Loading WebSocket fix for Replit');

// Check if we're running on Replit
if (window.location.hostname.includes('.replit.dev') || window.location.hostname.includes('.repl.co') || window.location.hostname.includes('.janeway.')) {
  // Store the original WebSocket constructor
  const OriginalWebSocket = window.WebSocket;
  
  // Override the WebSocket constructor
  window.WebSocket = function(url, protocols) {
    try {
      // Get the current hostname from the page URL
      const currentHost = window.location.host;
      
      // Handle various cases of problematic URLs
      if (!url || url === 'undefined' || url === 'null' || url.includes('localhost:undefined') || url.includes('127.0.0.1:undefined')) {
        // Create a fallback WebSocket URL using the current host
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        
        // If we have a token in the original URL, preserve it
        let token = '';
        if (url && url.includes('token=')) {
          try {
            const tokenMatch = url.match(/token=([^&]*)/);
            if (tokenMatch && tokenMatch[1]) {
              token = `?token=${tokenMatch[1]}`;
            }
          } catch (e) {
            console.error('[vite-hmr-fix] Error extracting token:', e);
          }
        }
        
        const fallbackUrl = `${protocol}//${currentHost}${token}`;
        console.log('[vite-hmr-fix] Using fallback WebSocket URL:', fallbackUrl);
        return new OriginalWebSocket(fallbackUrl, protocols);
      }
      
      // Check if this is a Vite HMR WebSocket connection to localhost
      if (typeof url === 'string' && (url.includes('localhost') || url.includes('127.0.0.1'))) {
        try {
          // Extract the path and query string
          const urlObj = new URL(url);
          const path = urlObj.pathname;
          const search = urlObj.search;
          
          // Create a new WebSocket URL using the correct hostname
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const newUrl = `${protocol}//${currentHost}${path}${search}`;
          
          console.log('[vite-hmr-fix] Fixed WebSocket URL from', url, 'to', newUrl);
          
          // Create a WebSocket with the fixed URL
          return new OriginalWebSocket(newUrl, protocols);
        } catch (e) {
          console.error('[vite-hmr-fix] Error parsing WebSocket URL:', e);
          // If URL parsing fails, fall back to the current host
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          
          // If we have a token in the original URL, preserve it
          let token = '';
          if (url && url.includes('token=')) {
            try {
              const tokenMatch = url.match(/token=([^&]*)/);
              if (tokenMatch && tokenMatch[1]) {
                token = `?token=${tokenMatch[1]}`;
              }
            } catch (e) {
              console.error('[vite-hmr-fix] Error extracting token:', e);
            }
          }
          
          const fallbackUrl = `${protocol}//${currentHost}${token}`;
          return new OriginalWebSocket(fallbackUrl, protocols);
        }
      }
    } catch (err) {
      console.error('[vite-hmr-fix] Error in WebSocket constructor:', err);
    }
    
    // For non-Vite WebSockets or if any of our fixes fail, use the original connection
    return new OriginalWebSocket(url, protocols);
  };
  
  // Copy over static properties from the original WebSocket
  for (const prop in OriginalWebSocket) {
    if (OriginalWebSocket.hasOwnProperty(prop)) {
      window.WebSocket[prop] = OriginalWebSocket[prop];
    }
  }
  
  window.WebSocket.prototype = OriginalWebSocket.prototype;
  
  console.log('[vite-hmr-fix] WebSocket fix applied for Replit environment');
  
  // Inform Vite about our production URL for better HMR connections
  if (window.__VUE_HMR_RUNTIME__ || window.__vite_plugin_react_preamble_installed__) {
    console.log('[vite-hmr-fix] Setting up HMR runtime configuration');
    
    // Force HMR to use the correct host
    const hmrPort = ''; // Empty string means use the same port as the page
    const hmrHost = window.location.hostname;
    
    // Check if we can access Vite's HMR configuration
    if (window.__vite_plugin_react_preamble_installed__ && window.__vite__) {
      console.log('[vite-hmr-fix] Configuring React HMR');
      if (window.__vite__.config) {
        window.__vite__.config.server = window.__vite__.config.server || {};
        window.__vite__.config.server.hmr = window.__vite__.config.server.hmr || {};
        window.__vite__.config.server.hmr.host = hmrHost;
        window.__vite__.config.server.hmr.port = hmrPort;
      }
    }
    
    // For Vue HMR
    if (window.__VUE_HMR_RUNTIME__) {
      console.log('[vite-hmr-fix] Configuring Vue HMR');
      // No direct config access for Vue, but our WebSocket override should handle it
    }
  }
}