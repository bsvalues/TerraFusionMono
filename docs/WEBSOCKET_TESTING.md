# WebSocket Testing and Debugging Guide

This guide explains how to test and debug WebSocket connections in the TerraFusionMono Replit environment.

## Testing WebSocket Connections

The repository includes a WebSocket test client script (`test-websocket-client.js`) that can be used to verify WebSocket connectivity.

### Using the Test Client

Run the test client with:

```bash
node test-websocket-client.js [optional-url]
```

If no URL is provided, the script will attempt to determine the correct URL for the current Replit environment.

### Test Client Features

- Automatically detects Replit environment and uses the appropriate WebSocket URL
- Sends a test message with environment information
- Shows connection status and any received messages
- Provides diagnostic information for common connection issues
- Tests HTTPS connectivity if WebSocket connection fails

## Debugging WebSocket Issues

If you're experiencing WebSocket connection issues in your application, the following steps can help identify and resolve the problem:

### Browser-side Debugging

1. **Check Browser Console**

   Open your browser's developer tools (F12) and look for WebSocket-related errors in the console:
   
   ```
   [vite] failed to connect to websocket.
   ```

2. **Verify WebSocket Fix Inclusion**

   Ensure that the WebSocket fix script is included in your HTML:
   
   ```html
   <script src="/vite-hmr-fix.js"></script>
   ```

3. **Test with the Fix Disabled**

   Temporarily comment out the WebSocket fix script to see if the issue persists, which can help identify if the fix itself is causing problems.

### Server-side Debugging

1. **Check Server Logs**

   Look for any WebSocket connection attempts in your server logs.

2. **Verify Port Configuration**

   Ensure that your WebSocket server is bound to `0.0.0.0` instead of `localhost` to allow external connections.

3. **Test with Simple Echo Server**

   Create a simple WebSocket echo server to test basic connectivity:
   
   ```javascript
   const WebSocket = require('ws');
   const wss = new WebSocket.Server({ port: 8080, host: '0.0.0.0' });
   
   wss.on('connection', (ws) => {
     console.log('Client connected');
     ws.on('message', (message) => {
       console.log('Received: %s', message);
       ws.send(`Echo: ${message}`);
     });
   });
   
   console.log('WebSocket server started on port 8080');
   ```

## Common WebSocket Issues in Replit

### Issue: Connections to localhost

WebSocket connections to `localhost` or `127.0.0.1` will fail in Replit because the client is connecting from a different origin than where the server is running.

**Solution:** Use the Replit domain instead of localhost:

```javascript
const domain = window.location.hostname;
const ws = new WebSocket(`wss://${domain}`);
```

### Issue: Incorrect Protocol

Using `ws://` instead of `wss://` for secure Replit domains.

**Solution:** Always use `wss://` for WebSocket connections in Replit:

```javascript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const ws = new WebSocket(`${protocol}//${window.location.host}`);
```

### Issue: Port Specification

Including a port in the WebSocket URL can cause connection issues in Replit.

**Solution:** Omit the port and let Replit handle the routing:

```javascript
// Instead of:
const ws = new WebSocket('wss://my-repl.replit.dev:3000');

// Use:
const ws = new WebSocket('wss://my-repl.replit.dev');
```

## Testing with External Tools

You can also use external tools to test WebSocket connections:

- [WebSocket King](https://websocketking.com/) - Browser-based WebSocket client
- [wscat](https://github.com/websockets/wscat) - Command-line WebSocket client

Example with wscat:

```bash
npm install -g wscat
wscat -c wss://your-repl-name.replit.dev
```