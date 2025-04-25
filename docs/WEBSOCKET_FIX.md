# WebSocket Connectivity Fixes for Replit and Janeway Environments

This document explains the WebSocket connectivity fixes implemented for TerraFusionMono to ensure stable connections in various Replit environments, particularly focusing on Vite's Hot Module Replacement (HMR).

## Overview of the Problem

Replit environments, especially Janeway (the AI Agent environment), face challenges with WebSocket connections due to:

1. Hostname/domain discrepancies
2. Proxy configurations
3. Security tokens not being properly forwarded
4. Cross-origin constraints

## Fix Implementation Layers

We've implemented a multi-layered approach to ensure robustness:

### 1. Client-Side JavaScript Fixes

These are injected into the HTML and execute in the browser to patch WebSocket connections:

- **vite-hmr-fix.js**: Basic fix for standard Replit environments
- **improved-vite-hmr-fix.js**: Enhanced fix with better token handling and fallback mechanisms
- **janeway-vite-hmr-fix.js**: Specialized fix for the Janeway AI Agent environment
- **janeway-direct-fix.js**: Aggressive WebSocket patching for Janeway when other fixes fail

### 2. Auto-Detecting Launcher

**vite-hmr-launcher.js** detects the current environment and loads the appropriate fix scripts:

```javascript
// Example from vite-hmr-launcher.js
if (isJaneway) {
  console.log('[vite-hmr-launcher] Janeway environment detected');
  scriptsToLoad.push('/janeway-vite-hmr-fix.js');
  scriptsToLoad.push('/janeway-direct-fix.js');
} else {
  console.log('[vite-hmr-launcher] Standard Replit environment detected');
  scriptsToLoad.push('/improved-vite-hmr-fix.js');
}
```

### 3. Server-Side Plugins

To complement the client-side fixes, we've created Vite plugins:

- **vite-hmr-fix-plugin.js**: Standard plugin for Replit
- **enhanced-vite-hmr-fix-plugin.js**: Enhanced plugin with Janeway support
- **janeway-vite-plugin.js**: Janeway-specific plugin

## Utility Scripts

The following scripts help apply and manage the WebSocket fixes:

- **apply-websocket-fix.sh**: Applies the appropriate fix to Vite applications
- **check-websocket-environment.sh**: Diagnoses the current environment
- **convert-to-launcher.sh**: Converts existing fixes to use the auto-detecting launcher

## Testing Tools

For validation and debugging:

- **test-websocket-server.js**: Advanced WebSocket server for testing connections
- **test-websocket-client.js**: Client for testing WebSocket connectivity

## Usage Guidelines

### For New Applications

Add the following to your `index.html` file before any other scripts:

```html
<script src="/vite-hmr-launcher.js"></script>
```

### For Existing Applications with WebSocket Issues

Run the converter script:

```bash
./convert-to-launcher.sh
```

### For Advanced Debugging

Use the WebSocket test server and client:

```bash
node test-websocket-server.js
```

## Environment Detection

The fixes use the following environment detection strategy:

1. **Replit Standard**: Checks for `process.env.REPL_ID` and `process.env.REPL_SLUG`
2. **Janeway**: Checks for `process.env.REPLIT_ENVIRONMENT === 'janeway' || process.env.REPLIT_ENVIRONMENT === 'ai'`

## Troubleshooting

If WebSocket connections still fail:

1. Check console logs for detailed error messages
2. Verify that the launcher script is loaded before any Vite-related code
3. Try running `check-websocket-environment.sh` to diagnose connectivity issues
4. For Janeway environments, ensure both fix scripts are loaded

## Notes for Maintenance

When updating Vite or related packages:

1. Test WebSocket connectivity in both standard Replit and Janeway environments
2. Check if the fix strategies are still applicable
3. Update the fix scripts as needed to accommodate changes in Vite's WebSocket implementation