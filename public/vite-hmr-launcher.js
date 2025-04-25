/**
 * Vite HMR Fix Launcher
 * 
 * This script detects the current Replit environment and loads the appropriate
 * WebSocket fix script for Vite's Hot Module Replacement.
 */

(function() {
  console.log('[vite-hmr-launcher] Initializing WebSocket fix launcher');
  
  // Detect current environment
  const hostname = window.location.hostname;
  
  // Check for specific environment types
  const isJaneway = hostname.includes('.janeway.'); 
  const isReplit = hostname.includes('.replit.') || hostname.includes('.repl.co');
  
  if (!isReplit && !isJaneway) {
    console.log('[vite-hmr-launcher] Not in a Replit environment, no fix needed');
    return;
  }
  
  // Choose the appropriate fix script based on the environment
  let scriptToLoad;
  
  if (isJaneway) {
    console.log('[vite-hmr-launcher] Janeway environment detected');
    scriptToLoad = '/janeway-vite-hmr-fix.js';
  } else {
    console.log('[vite-hmr-launcher] Standard Replit environment detected');
    scriptToLoad = '/improved-vite-hmr-fix.js';
  }
  
  // Load the script
  const script = document.createElement('script');
  script.src = scriptToLoad;
  script.async = true;
  script.onerror = function() {
    console.error(`[vite-hmr-launcher] Failed to load script: ${scriptToLoad}`);
    
    // Fallback to basic fix if the specific fix fails to load
    if (scriptToLoad !== '/vite-hmr-fix.js') {
      console.log('[vite-hmr-launcher] Attempting to load fallback fix');
      const fallbackScript = document.createElement('script');
      fallbackScript.src = '/vite-hmr-fix.js';
      fallbackScript.async = true;
      document.head.appendChild(fallbackScript);
    }
  };
  
  // Insert the script into the document
  document.head.appendChild(script);
  console.log(`[vite-hmr-launcher] Loading WebSocket fix: ${scriptToLoad}`);
})();