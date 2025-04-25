/**
 * Janeway-Specific Vite HMR Fix
 * 
 * This script is specially designed to fix WebSocket connection issues
 * in Replit's Janeway environment with Vite's Hot Module Replacement.
 */

console.log('[janeway-vite-hmr-fix] Loading specialized Janeway WebSocket fix');

(function() {
  // Only apply in Janeway environment
  if (!window.location.hostname.includes('.janeway.')) {
    console.log('[janeway-vite-hmr-fix] Not in Janeway environment, skipping fix');
    return;
  }

  console.log('[janeway-vite-hmr-fix] Janeway environment detected, applying fix');
  
  // Store original WebSocket constructor
  const OriginalWebSocket = window.WebSocket;
  
  // Keep track of connection attempts to prevent infinite loops
  const connectionAttempts = new Map();
  
  // Store current domain information
  const currentHost = window.location.host;
  const currentProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  
  // Override the WebSocket constructor
  window.WebSocket = function(url, protocols) {
    try {
      // Track connection attempts
      const attemptKey = url || 'undefined-url';
      const attempts = connectionAttempts.get(attemptKey) || 0;
      connectionAttempts.set(attemptKey, attempts + 1);
      
      // Limit attempts to prevent infinite loops
      if (attempts > 3) {
        console.warn('[janeway-vite-hmr-fix] Too many attempts for same URL, using original WebSocket');
        return new OriginalWebSocket(url, protocols);
      }
      
      // Extract token if present
      let token = '';
      if (typeof url === 'string' && url.includes('token=')) {
        const tokenMatch = url.match(/[?&]token=([^&]+)/);
        if (tokenMatch && tokenMatch[1]) {
          token = `?token=${tokenMatch[1]}`;
        }
      }
      
      // Fix for localhost:undefined issues specifically
      if (url === undefined || url === null || 
          (typeof url === 'string' && (
            url.includes('localhost:undefined') || 
            url.includes('127.0.0.1:undefined')
          ))) {
        const fixedUrl = `${currentProtocol}//${currentHost}${token}`;
        console.log('[janeway-vite-hmr-fix] Fixing undefined URL to:', fixedUrl);
        return new OriginalWebSocket(fixedUrl, protocols);
      }
      
      // Fix for other localhost URLs
      if (typeof url === 'string' && (
        url.includes('localhost') || 
        url.includes('127.0.0.1')
      )) {
        // Extract path and query string
        let path = '';
        let query = token;
        
        try {
          const urlObj = new URL(url);
          path = urlObj.pathname || '';
          // Use existing query string if token is not already extracted
          if (!token && urlObj.search) {
            query = urlObj.search;
          }
        } catch (e) {
          console.log('[janeway-vite-hmr-fix] Error parsing URL:', e);
        }
        
        const fixedUrl = `${currentProtocol}//${currentHost}${path}${query}`;
        console.log('[janeway-vite-hmr-fix] Fixed localhost URL from', url, 'to', fixedUrl);
        return new OriginalWebSocket(fixedUrl, protocols);
      }
    } catch (err) {
      console.error('[janeway-vite-hmr-fix] Error in WebSocket constructor:', err);
    }
    
    // Default: Use original WebSocket constructor
    return new OriginalWebSocket(url, protocols);
  };
  
  // Copy static properties
  for (const prop in OriginalWebSocket) {
    if (OriginalWebSocket.hasOwnProperty(prop)) {
      window.WebSocket[prop] = OriginalWebSocket[prop];
    }
  }
  
  // Copy prototype
  window.WebSocket.prototype = OriginalWebSocket.prototype;
  
  console.log('[janeway-vite-hmr-fix] WebSocket constructor replaced');
  
  // Direct intervention in Vite's HMR client
  function patchViteHmrClient() {
    // Wait for Vite's HMR client to be loaded
    setTimeout(() => {
      try {
        // Check if Vite is present in the window
        if (window.__vite__) {
          console.log('[janeway-vite-hmr-fix] Patching Vite HMR client directly');
          
          // Get HMR object
          const hmr = window.__vite__.hot;
          
          if (hmr) {
            // Force Vite to use the correct host for WebSocket connections
            const options = {
              host: currentHost,
              port: '',
              protocol: currentProtocol.replace(':', ''),
              path: '/',
              timeout: 30000
            };
            
            console.log('[janeway-vite-hmr-fix] Setting HMR options:', options);
            
            // Store original methods
            const originalCreateConnection = hmr.createConnection;
            
            // Override the connection creation method
            hmr.createConnection = function() {
              console.log('[janeway-vite-hmr-fix] Creating HMR connection with fixed options');
              return originalCreateConnection.call(this, options);
            };
            
            // Try to force reconnection if socket exists but isn't open
            if (hmr.sock && hmr.sock.readyState !== WebSocket.OPEN) {
              console.log('[janeway-vite-hmr-fix] Forcing HMR reconnection');
              hmr.dispose();
              
              // Small delay before reconnecting
              setTimeout(() => {
                hmr.connect(options);
              }, 100);
            }
          }
        }
      } catch (e) {
        console.error('[janeway-vite-hmr-fix] Error patching Vite HMR client:', e);
      }
    }, 1000);
  }
  
  // Run the Vite HMR patching
  patchViteHmrClient();
  
  // Also patch on load to ensure it runs after everything is initialized
  window.addEventListener('load', patchViteHmrClient);
  
  // Fix script loading issues
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = function(tagName) {
    const element = originalCreateElement(tagName);
    
    // Add extra handling for script tags
    if (tagName.toLowerCase() === 'script') {
      const originalSetAttribute = element.setAttribute.bind(element);
      element.setAttribute = function(name, value) {
        if (name === 'src' && typeof value === 'string') {
          // Fix localhost URLs in script src attributes
          if (value.includes('localhost') || value.includes('127.0.0.1')) {
            try {
              const urlObj = new URL(value);
              const newValue = `${window.location.protocol}//${currentHost}${urlObj.pathname}${urlObj.search}`;
              console.log('[janeway-vite-hmr-fix] Fixed script src from', value, 'to', newValue);
              return originalSetAttribute.call(this, name, newValue);
            } catch (e) {
              console.error('[janeway-vite-hmr-fix] Error fixing script src:', e);
            }
          }
        }
        return originalSetAttribute.call(this, name, value);
      };
    }
    
    return element;
  };
  
  // Override fetch to fix localhost URLs
  const originalFetch = window.fetch;
  window.fetch = function(resource, init) {
    if (typeof resource === 'string' && (resource.includes('localhost') || resource.includes('127.0.0.1'))) {
      try {
        const urlObj = new URL(resource);
        const newResource = `${window.location.protocol}//${currentHost}${urlObj.pathname}${urlObj.search}`;
        console.log('[janeway-vite-hmr-fix] Fixed fetch URL from', resource, 'to', newResource);
        return originalFetch(newResource, init);
      } catch (e) {
        console.error('[janeway-vite-hmr-fix] Error fixing fetch URL:', e);
      }
    }
    return originalFetch(resource, init);
  };
  
  console.log('[janeway-vite-hmr-fix] All fixes applied successfully');
})();