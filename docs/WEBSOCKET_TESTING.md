# Advanced WebSocket Testing and Debugging Guide

This guide explains how to test and debug WebSocket connections in the TerraFusionMono Replit environment, with a focus on fixing issues with Vite's Hot Module Replacement (HMR).

## Testing WebSocket Connections

The repository includes a WebSocket test client script (`test-websocket-client.js`) that can be used to verify WebSocket connectivity.

### Using the Test Client

Run the test client with:

```bash
node test-websocket-client.js [optional-url]
```

If no URL is provided, the script will automatically detect the Replit environment and use the appropriate WebSocket URL.

### Test Client Features

- Automatically detects Replit environment and constructs the appropriate WebSocket URL
- Extracts authentication tokens from URLs when necessary
- Sends a test message with detailed environment information
- Shows connection status and any received messages
- Provides diagnostic information for common connection issues
- Tests HTTPS connectivity if WebSocket connection fails to help identify network problems
- Indicates if issues might be related to TLS/SSL certificates

## Comprehensive Debugging Process

If you're experiencing WebSocket connection issues in your application, this systematic approach will help identify and resolve the problems:

### Step 1: Identify the Environment Type

Different Replit environments may require different fixes:

- **Standard Replit**: `.replit.dev` domains (newer environments)
- **Classic Replit**: `.repl.co` domains (older environments)
- **Janeway Environment**: Special environment used by Replit's AI agents

Run this to check your environment:

```bash
echo "REPL_ID: $REPL_ID"
echo "REPL_SLUG: $REPL_SLUG"
echo "REPLIT_DOMAINS: $REPLIT_DOMAINS"
echo "REPLIT_ENVIRONMENT: $REPLIT_ENVIRONMENT"
```

### Step 2: Use the Enhanced WebSocket Fixes

Based on your environment, choose:

- **For Standard/Classic Replit**: Use the standard fixes
- **For Janeway or Complex Issues**: Use the enhanced fixes

#### Client-side fixes:

```html
<!-- Standard fix -->
<script src="/vite-hmr-fix.js"></script>

<!-- OR, for Janeway environment or if standard fix doesn't work -->
<script src="/improved-vite-hmr-fix.js"></script>
```

#### Server-side fixes:

```javascript
// Standard plugin
import viteHmrFixPlugin from '../../vite-hmr-fix-plugin.js';

// OR, enhanced plugin with more features
import enhancedViteHmrFixPlugin from '../../enhanced-vite-hmr-fix-plugin.js';

export default defineConfig({
  plugins: [
    // Use the appropriate plugin:
    viteHmrFixPlugin(),
    // OR
    enhancedViteHmrFixPlugin({ verbose: true }), // verbose option for debugging
  ],
});
```

### Step 3: Analyze Browser Console Logs

Open your browser's developer tools (F12) and look for WebSocket-related errors in the console.

Common error patterns:

1. **Failed to connect errors**:
   ```
   [vite] failed to connect to websocket.
   your current setup:
     (browser) my-repl.replit.dev/ <--[HTTP]--> localhost:undefined/ (server)
     (browser) my-repl.replit.dev:/ <--[WebSocket (failing)]--> localhost:undefined/ (server)
   ```

2. **Certificate errors**:
   ```
   WebSocket connection to 'wss://...' failed: Error in connection establishment: net::ERR_CERT_AUTHORITY_INVALID
   ```

3. **Token-related issues**:
   ```
   WebSocket connection to 'wss://my-repl.replit.dev/?token=...' failed
   ```

### Step 4: Run Diagnostic Scripts

The monorepo includes scripts to check for issues:

```bash
# Check all Vite applications for WebSocket fix problems
./check-vite-apps.sh

# Test direct WebSocket connectivity
node test-websocket-client.js
```

### Step 5: Server Configuration Verification

Ensure your server is properly configured:

1. **Check `vite.config.js` settings**:
   ```javascript
   export default defineConfig({
     server: {
       host: '0.0.0.0', // IMPORTANT: must bind to all interfaces
       hmr: {
         // HMR should be auto-configured by the plugin
       }
     }
   });
   ```

2. **Verify that the server is running and accessible**:
   ```bash
   curl -I https://$(echo $REPLIT_DOMAINS | jq -r '.[0]')
   ```

## Troubleshooting Specific Issues

### Issue: "localhost:undefined" in Connection Error

This typically indicates that Vite's HMR client doesn't have a proper host configuration.

**Solution**: Use the enhanced WebSocket fix:

```html
<script src="/improved-vite-hmr-fix.js"></script>
```

The improved script specifically handles this "undefined" port case and preserves authentication tokens.

### Issue: Connection Works in Browser but Fails from Test Client

This may be due to authentication or cross-origin issues.

**Solution**: Check for authorization headers or tokens in the browser's WebSocket request (in Network tab) and add them to your test client:

```bash
node test-websocket-client.js "wss://my-repl.replit.dev/?token=YOUR_TOKEN"
```

### Issue: HMR Connects but Doesn't Refresh Page

This could be caused by Vite's overlay configuration or event handling.

**Solution**: Use the enhanced plugin with verbose mode to see detailed logs:

```javascript
enhancedViteHmrFixPlugin({ verbose: true })
```

### Issue: Inconsistent Behavior After Reload

WebSocket connection information may be cached.

**Solution**: Try clearing browser cache and hard-reloading (Ctrl+Shift+R).

## Advanced: Creating a Custom WebSocket Test Server

For more detailed testing, you can create a custom WebSocket server:

```javascript
// Save as test-websocket-server.js
const WebSocket = require('ws');
const http = require('http');

// Create HTTP server to handle upgrades
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket Test Server\n');
});

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  path: '/ws',  // Optional path for the WebSocket endpoint
});

// Handle connections
wss.on('connection', (ws, req) => {
  console.log(`Connection from ${req.socket.remoteAddress}`);
  
  // Echo back any messages
  ws.on('message', (message) => {
    console.log(`Received: ${message}`);
    ws.send(`Echo: ${message}`);
  });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to test WebSocket server',
    timestamp: new Date().toISOString(),
    clientInfo: {
      address: req.socket.remoteAddress,
      headers: req.headers
    }
  }));
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket test server running on port ${PORT}`);
});
```

Run it with:

```bash
node test-websocket-server.js
```

## External Testing Tools

For a comprehensive assessment, you can use these external tools:

- [WebSocket King](https://websocketking.com/) - Browser-based WebSocket client with detailed logging
- [wscat](https://github.com/websockets/wscat) - Command-line WebSocket client for testing
- [WebSocket Test Page](https://www.websocket.org/echo.html) - Basic WebSocket test page

## Best Practices for WebSocket in Replit

1. **Always use WSS protocol** in Replit environments
2. **Bind servers to `0.0.0.0`** to accept connections from all interfaces
3. **Use the included fix scripts** for Vite HMR applications
4. **Implement reconnection logic** in your WebSocket clients
5. **Preserve authentication tokens** when fixing WebSocket URLs
6. **Monitor WebSocket connections** in browser developer tools