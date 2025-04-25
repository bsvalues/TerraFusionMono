/**
 * Improved Vite HMR Fix for Replit
 * 
 * This enhanced version specifically addresses issues seen in Replit's Janeway environment
 * and provides a more robust solution for WebSocket connectivity problems.
 */

console.log('[improved-vite-hmr-fix] Loading enhanced WebSocket fix for Replit');

(function() {
  // Only apply in Replit environments
  if (!window.location.hostname.includes('.replit.dev') && 
      !window.location.hostname.includes('.repl.co') && 
      !window.location.hostname.includes('.janeway.')) {
    console.log('[improved-vite-hmr-fix] Not in Replit environment, skipping fix');
    return;
  }

  // Store original WebSocket constructor
  const OriginalWebSocket = window.WebSocket;
  
  // Keep track of connection attempts to avoid infinite loops
  const connectionAttempts = new Map();
  const MAX_ATTEMPTS = 3;
  
  // Store current protocol and host
  const currentProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const currentHost = window.location.host;
  
  // Function to extract token from URL
  function extractToken(url) {
    if (!url || typeof url !== 'string') return '';
    
    try {
      const tokenMatch = url.match(/[?&]token=([^&]+)/);
      return tokenMatch ? `?token=${tokenMatch[1]}` : '';
    } catch (e) {
      console.error('[improved-vite-hmr-fix] Error extracting token:', e);
      return '';
    }
  }
  
  // Function to create a fallback URL
  function createFallbackUrl(originalUrl) {
    const token = extractToken(originalUrl);
    return `${currentProto}//${currentHost}${token}`;
  }
  
  // Override WebSocket constructor
  window.WebSocket = function(url, protocols) {
    // Record this attempt
    const attemptKey = url || 'undefined-url';
    const attempts = connectionAttempts.get(attemptKey) || 0;
    connectionAttempts.set(attemptKey, attempts + 1);
    
    // If we've tried too many times, use original to avoid loops
    if (attempts >= MAX_ATTEMPTS) {
      console.warn(`[improved-vite-hmr-fix] Too many attempts (${attempts}) for ${attemptKey}, using original WebSocket`);
      return new OriginalWebSocket(url, protocols);
    }
    
    try {
      // Case 1: Undefined URL or localhost:undefined
      if (!url || 
          url === 'undefined' || 
          url === 'null' || 
          url.includes('localhost:undefined') || 
          url.includes('127.0.0.1:undefined')) {
        
        const fallbackUrl = createFallbackUrl(url);
        console.log('[improved-vite-hmr-fix] Fixing undefined/null URL to:', fallbackUrl);
        return new OriginalWebSocket(fallbackUrl, protocols);
      }
      
      // Case 2: Other localhost URLs
      if (typeof url === 'string' && (url.includes('localhost') || url.includes('127.0.0.1'))) {
        try {
          // Parse the URL to preserve path and query
          const urlObj = new URL(url);
          
          // Create new URL with correct host but keep everything else
          const newUrl = `${currentProto}//${currentHost}${urlObj.pathname}${urlObj.search}`;
          
          console.log('[improved-vite-hmr-fix] Fixing localhost URL from', url, 'to', newUrl);
          return new OriginalWebSocket(newUrl, protocols);
        } catch (e) {
          console.error('[improved-vite-hmr-fix] Error parsing WebSocket URL:', e);
          
          // Fallback to simpler approach
          const fallbackUrl = createFallbackUrl(url);
          console.log('[improved-vite-hmr-fix] Using fallback URL:', fallbackUrl);
          return new OriginalWebSocket(fallbackUrl, protocols);
        }
      }
      
      // Case 3: Fix incomplete URLs that are just paths
      if (typeof url === 'string' && url.startsWith('/')) {
        const fixedUrl = `${currentProto}//${currentHost}${url}`;
        console.log('[improved-vite-hmr-fix] Fixing path-only URL to:', fixedUrl);
        return new OriginalWebSocket(fixedUrl, protocols);
      }
    } catch (err) {
      console.error('[improved-vite-hmr-fix] Error in WebSocket constructor:', err);
    }
    
    // Default case: use original connection for non-problematic URLs
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
  
  console.log('[improved-vite-hmr-fix] Enhanced WebSocket fix applied');
  
  // Patch Vite's HMR client if present
  function patchViteHmrClient() {
    if (window.__vite_plugin_react_preamble_installed__ || 
        window.__vite__ || 
        window.__VUE_HMR_RUNTIME__) {
      
      console.log('[improved-vite-hmr-fix] Attempting to patch Vite HMR client');
      
      // Wait for the HMR client to be fully initialized
      setTimeout(() => {
        try {
          // Force reconnect with correct options
          if (window.__vite__ && window.__vite__.hot) {
            const hot = window.__vite__.hot;
            
            // Store original connect function
            const originalConnect = hot.connect;
            
            // Replace connect function
            hot.connect = function(...args) {
              console.log('[improved-vite-hmr-fix] Intercepted HMR connect call');
              
              // Replace connection options
              const options = {
                host: currentHost,
                protocol: currentProto.replace(':', ''),
                path: '/',
                timeout: 30000,
                overlay: true
              };
              
              // Call original with modified options
              return originalConnect.call(this, options);
            };
            
            // Force reconnect if already connected
            if (hot.sock && hot.sock.readyState !== WebSocket.OPEN) {
              console.log('[improved-vite-hmr-fix] Forcing HMR reconnect');
              hot.dispose();
              hot.connect();
            }
          }
        } catch (e) {
          console.error('[improved-vite-hmr-fix] Error patching Vite HMR client:', e);
        }
      }, 1000);
    }
  }
  
  // Try to patch the HMR client
  patchViteHmrClient();
  
  // Also patch on load event to ensure it runs after Vite initializes
  window.addEventListener('load', patchViteHmrClient);
  
  // Intercept fetch requests to localhost (for source maps and HMR manifest)
  const originalFetch = window.fetch;
  window.fetch = function(resource, init) {
    try {
      if (typeof resource === 'string' && 
          (resource.includes('localhost') || resource.includes('127.0.0.1'))) {
        
        const url = new URL(resource);
        const newUrl = `${window.location.protocol}//${currentHost}${url.pathname}${url.search}`;
        
        console.log('[improved-vite-hmr-fix] Fixing fetch URL from', resource, 'to', newUrl);
        return originalFetch(newUrl, init);
      }
    } catch (e) {
      console.error('[improved-vite-hmr-fix] Error fixing fetch URL:', e);
    }
    
    return originalFetch(resource, init);
  };
})();