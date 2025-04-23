// This script fixes the Vite HMR WebSocket connection issue
// It runs before Vite's client script and ensures the HMR WebSocket always works in Replit

(function() {
  console.log('[vite-hmr-fix] Setting up HMR connection fix for Replit environment');
  
  // Store the original WebSocket constructor
  const OriginalWebSocket = window.WebSocket;
  
  // Override WebSocket constructor to intercept Vite HMR connections
  window.WebSocket = function(url, protocols) {
    // Parse the URL to understand where it's trying to connect
    try {
      let newUrl = url;
      
      // Check if this is a Vite HMR WebSocket connection
      if (typeof url === 'string' && (url.includes('vite') || url.includes('hmr') || url.includes('ws'))) {
        const urlObj = new URL(url);
        
        // Fix for localhost:undefined pattern
        if (urlObj.host.includes('localhost:undefined')) {
          // Get the current host from the window location
          const currentHost = window.location.host;
          // Use same protocol (ws/wss) as the original URL
          const protocol = urlObj.protocol;
          // Keep the pathname and search params
          const pathAndParams = urlObj.pathname + urlObj.search;
          
          // Construct a new URL using the current hostname but keeping the original URL's protocol and path
          newUrl = `${protocol}//${currentHost}${pathAndParams}`;
          console.log('[vite-hmr-fix] Redirecting WebSocket from', url, 'to', newUrl);
        }
      }
      
      // Call the original WebSocket constructor with the fixed URL
      return new OriginalWebSocket(newUrl, protocols);
    } catch (e) {
      console.error('[vite-hmr-fix] Error fixing WebSocket URL:', e);
      // Fallback to original behavior
      return new OriginalWebSocket(url, protocols);
    }
  };
  
  // Copy properties from the original WebSocket constructor
  for (const prop in OriginalWebSocket) {
    if (OriginalWebSocket.hasOwnProperty(prop)) {
      window.WebSocket[prop] = OriginalWebSocket[prop];
    }
  }
  
  // Set prototype to match original
  window.WebSocket.prototype = OriginalWebSocket.prototype;
  
  // Notify that the patch has been applied
  console.log('[vite-hmr-fix] WebSocket connection handling enabled for Replit environment');
  
  // Add a custom event listener for Vite to detect when it tries to connect but fails
  window.addEventListener('error', function(event) {
    if (event && event.message && typeof event.message === 'string' && 
        (event.message.includes('WebSocket') || event.message.includes('vite') || event.message.includes('hmr'))) {
      console.log('[vite-hmr-fix] Detected WebSocket error:', event.message);
    }
  });
})();