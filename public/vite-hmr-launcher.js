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
  
  // Choose the appropriate fix scripts based on the environment
  let scriptsToLoad = [];
  
  if (isJaneway) {
    console.log('[vite-hmr-launcher] Janeway environment detected');
    scriptsToLoad.push('/janeway-vite-hmr-fix.js');
    scriptsToLoad.push('/janeway-direct-fix.js'); // Add the aggressive fix
  } else {
    console.log('[vite-hmr-launcher] Standard Replit environment detected');
    scriptsToLoad.push('/improved-vite-hmr-fix.js');
  }
  
  // Load all scripts
  function loadScript(src, isLast) {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onerror = function() {
      console.error(`[vite-hmr-launcher] Failed to load script: ${src}`);
      
      // Fallback to basic fix if all else fails and this is the last script
      if (isLast && src !== '/vite-hmr-fix.js') {
        console.log('[vite-hmr-launcher] Attempting to load fallback fix');
        const fallbackScript = document.createElement('script');
        fallbackScript.src = '/vite-hmr-fix.js';
        fallbackScript.async = true;
        document.head.appendChild(fallbackScript);
      }
    };
    
    // Insert the script into the document
    document.head.appendChild(script);
    console.log(`[vite-hmr-launcher] Loading WebSocket fix: ${src}`);
  }
  
  // Load each script in sequence
  for (let i = 0; i < scriptsToLoad.length; i++) {
    const isLast = i === scriptsToLoad.length - 1;
    loadScript(scriptsToLoad[i], isLast);
  }
})();