// This is a simplified WebSocket fix for Vite HMR in Replit
// It replaces the invalid localhost:undefined URL with the current host

(function() {
  console.log('[vite-hmr-fix] Loading WebSocket fix for Replit');
  
  // Store the original WebSocket constructor
  const OriginalWebSocket = window.WebSocket;
  
  // Create a simpler WebSocket wrapper to handle invalid URLs
  window.WebSocket = function(url, protocols) {
    try {
      // Check if this is an invalid URL with localhost:undefined
      if (typeof url === 'string' && url.includes('localhost:undefined')) {
        // Extract the protocol (ws: or wss:)
        const protocol = url.startsWith('wss:') ? 'wss:' : 'ws:';
        
        // Get the current host from window.location
        const currentHost = window.location.host;
        
        // Extract the path and query string (everything after the hostname)
        const pathAndQuery = url.split('localhost:undefined')[1] || '';
        
        // Construct a new URL with the current host
        const fixedUrl = protocol + '//' + currentHost + pathAndQuery;
        
        console.log('[vite-hmr-fix] Fixed WebSocket URL from', url, 'to', fixedUrl);
        
        // Create WebSocket with the fixed URL
        return new OriginalWebSocket(fixedUrl, protocols);
      }
      
      // For all other URLs, use the original constructor
      return new OriginalWebSocket(url, protocols);
    } catch (err) {
      console.error('[vite-hmr-fix] Error in WebSocket fix:', err);
      
      // Fallback to original behavior if our fix causes an error
      return new OriginalWebSocket(url, protocols);
    }
  };
  
  // Copy all static properties from the original WebSocket
  for (const prop in OriginalWebSocket) {
    if (OriginalWebSocket.hasOwnProperty(prop)) {
      window.WebSocket[prop] = OriginalWebSocket[prop];
    }
  }
  
  // Copy the prototype
  window.WebSocket.prototype = OriginalWebSocket.prototype;
  
  console.log('[vite-hmr-fix] WebSocket fix applied for Replit environment');
})();