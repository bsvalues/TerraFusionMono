/**
 * Vite HMR Fix for Replit
 * 
 * This script fixes WebSocket connection issues in Replit for Vite.
 * It intercepts WebSocket connections and rewrites the URLs to use
 * the correct Replit domain instead of localhost.
 */

console.log('[vite-hmr-fix] Loading WebSocket fix for Replit');

if (window.location.hostname.includes('.replit.dev')) {
  // Store the original WebSocket constructor
  const OriginalWebSocket = window.WebSocket;
  
  // Override the WebSocket constructor
  window.WebSocket = function(url, protocols) {
    // Get the current hostname from the page URL
    const currentHost = window.location.host;
    
    // Check if this is a Vite HMR WebSocket connection
    if (url.startsWith('ws://localhost:') || url.startsWith('wss://localhost:')) {
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
    }
    
    // For non-Vite WebSockets, use the original connection
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
}