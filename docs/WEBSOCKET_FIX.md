# WebSocket Fix for Vite HMR in Replit

This repository includes a fix for WebSocket connections when using Vite's Hot Module Replacement (HMR) in the Replit environment. Without this fix, development mode in Vite-based applications will not work correctly as WebSocket connections to `localhost` will fail.

## How It Works

The fix consists of two main parts:

1. **Client-side script** (`vite-hmr-fix.js`) that intercepts WebSocket connection attempts to localhost and redirects them to the correct Replit domain.

2. **Server-side plugin** (`vite-hmr-fix-plugin.js`) that configures Vite's server to use the correct hostname, port, and protocol for HMR connections.

## Adding the Fix to Imported Applications

When adding a new application to the monorepo or working with existing applications, ensure that the WebSocket fix is applied:

### For Applications Using Vite

1. Include the client-side fix in the HTML template by adding this line in the `<head>` section:

```html
<script src="/vite-hmr-fix.js"></script>
```

2. Import and use the plugin in your `vite.config.js` or `vite.config.ts`:

```js
import viteHmrFixPlugin from '../../vite-hmr-fix-plugin.js';

export default defineConfig({
  plugins: [
    // ... other plugins
    viteHmrFixPlugin(),
  ],
  // ... other configuration
});
```

### For Applications Not Using Vite

For applications not using Vite or not requiring hot module replacement, no changes are needed.

## Troubleshooting

If HMR is not working in your application, check the browser console for WebSocket-related errors. You might see:

```
[vite] failed to connect to websocket.
```

Solutions:

1. Verify that the vite-hmr-fix.js script is included in your HTML.
2. Make sure the viteHmrFixPlugin is correctly added to your Vite configuration.
3. Check that the application is running on port 3000 (Vite's default) or configured to use the correct port.

## Notes for Replit Environment

- The fix automatically detects when running in a Replit environment.
- It handles both the classic `.repl.co` domains and the newer `.replit.dev` domains.
- All WebSocket connections to localhost are rerouted to use the current Replit domain.