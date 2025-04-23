// This script fixes the Vite HMR WebSocket connection issue
// It runs before Vite's client script and ensures the HMR WebSocket always has a valid port

(function() {
  // Store the original WebSocket constructor
  const OriginalWebSocket = window.WebSocket;
  
  // Override WebSocket constructor to intercept Vite HMR connections
  window.WebSocket = function(url, protocols) {
    // Check if this is a Vite HMR WebSocket connection with an undefined port
    if (url && url.includes('localhost:undefined')) {
      // Replace undefined port with a fallback port (5000 is common for Replit)
      url = url.replace('localhost:undefined', 'localhost:5000');
      console.log('[vite-hmr-fix] Fixed WebSocket URL:', url);
    }
    
    // Call the original WebSocket constructor with the fixed URL
    return new OriginalWebSocket(url, protocols);
  };
  
  // Copy properties from the original WebSocket constructor
  for (const prop in OriginalWebSocket) {
    if (OriginalWebSocket.hasOwnProperty(prop)) {
      window.WebSocket[prop] = OriginalWebSocket[prop];
    }
  }
  
  // Set prototype to match original
  window.WebSocket.prototype = OriginalWebSocket.prototype;
  
  console.log('[vite-hmr-fix] WebSocket patched to handle undefined port');
})();