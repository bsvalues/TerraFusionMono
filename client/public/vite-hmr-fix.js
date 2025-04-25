/**
 * Vite HMR Fix for Replit
 * 
 * This script fixes WebSocket connection issues in Replit for Vite.
 * It intercepts WebSocket connections and rewrites the URLs to use
 * the correct Replit domain instead of localhost.
 */

console.log('[vite-hmr-fix] Loading WebSocket fix for Replit');

(function() {
  if (window.location.hostname.includes('.replit.dev') || window.location.hostname.includes('.repl.co')) {
    // Store the original WebSocket constructor
    const OriginalWebSocket = window.WebSocket;
    
    // Override the WebSocket constructor
    window.WebSocket = function(url, protocols) {
      try {
        // Get the current hostname from the page URL
        const currentHost = window.location.host;
        
        // Check if this is a Vite HMR WebSocket connection (includes localhost or undefined port)
        if (url.includes('localhost') || url.includes('undefined')) {
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
          } catch (urlError) {
            console.error('[vite-hmr-fix] Error parsing WebSocket URL:', urlError);
            
            // Fallback: try a simpler replacement if URL parsing fails
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const simpleUrl = `${wsProtocol}//${currentHost}`;
            console.log('[vite-hmr-fix] Using fallback WebSocket URL:', simpleUrl);
            return new OriginalWebSocket(simpleUrl, protocols);
          }
        }
      } catch (e) {
        console.error('[vite-hmr-fix] Error in WebSocket override:', e);
      }
      
      // For non-Vite WebSockets or if any errors occurred, use the original connection
      return new OriginalWebSocket(url, protocols);
    };
    
    // Copy over static properties from the original WebSocket
    for (const prop in OriginalWebSocket) {
      if (OriginalWebSocket.hasOwnProperty(prop)) {
        window.WebSocket[prop] = OriginalWebSocket[prop];
      }
    }
    
    window.WebSocket.prototype = OriginalWebSocket.prototype;
    
    // Also attempt to patch Vite's HMR directly if it becomes available
    function patchViteHmr() {
      if (window.__vite_hmr_client__) {
        try {
          const client = window.__vite_hmr_client__;
          if (client && client.wss && client.wss.startsWith('ws://localhost')) {
            const newWss = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
            console.log('[vite-hmr-fix] Patching Vite HMR client WSS from', client.wss, 'to', newWss);
            client.wss = newWss;
          }
        } catch (e) {
          console.error('[vite-hmr-fix] Failed to patch Vite HMR client:', e);
        }
      }
    }
    
    // Try to patch immediately and also set up a listener for when Vite's code might load
    patchViteHmr();
    setTimeout(patchViteHmr, 1000);
    setTimeout(patchViteHmr, 3000);
    
    console.log('[vite-hmr-fix] WebSocket fix applied for Replit environment');
  }
})();