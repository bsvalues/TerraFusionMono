/**
 * Janeway Direct WebSocket Fix for Vite
 * 
 * This script directly patches Vite's internal WebSocket client
 * in the Janeway environment where the standard fixes might not work.
 */

console.log('[janeway-direct-fix] Starting direct WebSocket patch for Janeway');

(function() {
  // Only apply in Janeway environment
  if (!window.location.hostname.includes('.janeway.')) {
    console.log('[janeway-direct-fix] Not in Janeway environment, skipping fix');
    return;
  }

  // Store current protocol and hostname
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = window.location.host;

  // Original WebSocket class
  const OriginalWebSocket = window.WebSocket;
  let patchedVite = false;
  let failedConnectAttempts = 0;

  // Aggressive fix: Check every 100ms until Vite's HMR is loaded
  const checkInterval = setInterval(() => {
    // If we've already patched or tried too many times, stop checking
    if (patchedVite || failedConnectAttempts > 50) {
      clearInterval(checkInterval);
      console.log('[janeway-direct-fix] Stopping checks for Vite HMR');
      return;
    }

    // Attempt to patch Vite's HMR client
    tryPatchViteHmr();
    failedConnectAttempts++;
  }, 100);

  // Override the WebSocket constructor for any new connections
  window.WebSocket = function(url, protocols) {
    // If it's a connection to localhost, fix it
    if (typeof url === 'string' && 
        (url.includes('localhost') || url.includes('127.0.0.1'))) {
      
      // Extract token if present
      let token = '';
      const tokenMatch = url.match(/[?&]token=([^&]+)/);
      if (tokenMatch && tokenMatch[1]) {
        token = `?token=${tokenMatch[1]}`;
      }
      
      // Replace with current hostname
      const fixedUrl = `${protocol}//${hostname}${token}`;
      console.log('[janeway-direct-fix] Redirecting WebSocket from', url, 'to', fixedUrl);
      
      return new OriginalWebSocket(fixedUrl, protocols);
    }
    
    // Otherwise use the original WebSocket
    return new OriginalWebSocket(url, protocols);
  };

  // Copy properties from the original WebSocket
  for (const prop in OriginalWebSocket) {
    window.WebSocket[prop] = OriginalWebSocket[prop];
  }

  // Copy prototype
  window.WebSocket.prototype = OriginalWebSocket.prototype;
  
  // Function to directly patch Vite's HMR client
  function tryPatchViteHmr() {
    try {
      console.log('[janeway-direct-fix] Attempting to patch Vite HMR client');
      
      // Check for Vite's global object
      if (!window.__vite__) {
        console.log('[janeway-direct-fix] Vite HMR not yet loaded');
        return;
      }
      
      // Access HMR
      const hmr = window.__vite__.hot;
      
      if (!hmr) {
        console.log('[janeway-direct-fix] Vite HMR interface not found');
        return;
      }
      
      console.log('[janeway-direct-fix] Found Vite HMR interface');
      
      // Override the WebSocket connection creation method
      const originalCreateConnection = hmr.createConnection;
      
      hmr.createConnection = function(...args) {
        console.log('[janeway-direct-fix] Creating Vite HMR connection with fixed options');
        
        // Force correct options
        const options = {
          host: hostname,
          path: '/__vite_hmr',
          protocol: protocol.replace(':', ''),
          clientPort: null,
          hmr: {
            host: hostname,
            protocol: protocol.replace(':', ''),
            clientPort: null,
            timeout: 30000
          }
        };
        
        // Apply options to hmr config
        Object.assign(this.options, options);
        
        // Call original with our options
        return originalCreateConnection.call(this, options);
      };
      
      // Force a reconnection if we have an existing socket
      if (hmr.sock) {
        console.log('[janeway-direct-fix] Disposing existing HMR connection');
        hmr.sock.close();
        hmr.sock = null;
        
        // Clear message queue
        hmr.messageBuffer = [];
        
        // Reconnect with new options
        setTimeout(() => {
          console.log('[janeway-direct-fix] Reconnecting HMR client');
          hmr.connect();
        }, 100);
      }
      
      patchedVite = true;
      console.log('[janeway-direct-fix] Successfully patched Vite HMR!');
      clearInterval(checkInterval);
      
    } catch (err) {
      console.log('[janeway-direct-fix] Failed to patch Vite HMR:', err);
    }
  }
  
  // Additional injection for Vite modules
  document.addEventListener('vite:beforeUpdate', (event) => {
    console.log('[janeway-direct-fix] Intercepted Vite update event');
  });
  
  // Handle page load completion
  window.addEventListener('load', () => {
    console.log('[janeway-direct-fix] Page loaded, final attempt to patch Vite HMR');
    tryPatchViteHmr();
  });
  
  console.log('[janeway-direct-fix] WebSocket override installed');
})();