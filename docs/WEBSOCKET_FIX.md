# Enhanced WebSocket Fix for Vite HMR in Replit

This repository includes an enhanced fix for WebSocket connections when using Vite's Hot Module Replacement (HMR) in the Replit environment. Without this fix, development mode in Vite-based applications will not work correctly as WebSocket connections to `localhost` will fail.

## How It Works

The fix consists of two main parts:

1. **Client-side scripts**:
   - `vite-hmr-fix.js` - Base version that intercepts WebSocket connections and redirects them to the correct Replit domain
   - `improved-vite-hmr-fix.js` - Enhanced version with extra support for Janeway environment and token handling

2. **Server-side plugins**:
   - `vite-hmr-fix-plugin.js` - Base plugin that configures Vite's server for Replit
   - `enhanced-vite-hmr-fix-plugin.js` - Advanced plugin with support for different Replit environments and improved debugging

## Adding the Fix to Imported Applications

When adding a new application to the monorepo or working with existing applications, ensure that the WebSocket fix is applied:

### For Applications Using Vite

1. Include the client-side fix in the HTML template by adding this line in the `<head>` section:

```html
<!-- Standard fix -->
<script src="/vite-hmr-fix.js"></script>

<!-- OR, for Janeway environment or if standard fix doesn't work -->
<script src="/improved-vite-hmr-fix.js"></script>
```

2. Import and use the plugin in your `vite.config.js` or `vite.config.ts`:

```js
// Standard plugin
import viteHmrFixPlugin from '../../vite-hmr-fix-plugin.js';

// OR, enhanced plugin with more features
import enhancedViteHmrFixPlugin from '../../enhanced-vite-hmr-fix-plugin.js';

export default defineConfig({
  plugins: [
    // ... other plugins
    
    // Use either the standard or enhanced plugin:
    viteHmrFixPlugin(),
    // OR
    enhancedViteHmrFixPlugin({ verbose: true }), // verbose option for debugging
  ],
  // ... other configuration
});
```

### Automatic Injection

The plugin will automatically inject the client-side fix into your HTML, so manual inclusion is only needed if automatic injection fails.

### For Applications Not Using Vite

For applications not using Vite or not requiring hot module replacement, no changes are needed.

## Troubleshooting

If HMR is not working in your application, check the browser console for WebSocket-related errors. You might see:

```
[vite] failed to connect to websocket.
```

### Common Issues and Solutions

#### 1. WebSocket Connection Failures

If you see WebSocket connection failures:

- Try switching to the improved fix scripts (`improved-vite-hmr-fix.js` and `enhanced-vite-hmr-fix-plugin.js`)
- Check if the script is correctly included in your HTML (should be in the `<head>` section)
- Verify the plugin is properly configured in your Vite config

#### 2. Port Conflicts

If you see errors about ports already in use:

- The plugin automatically handles port conflicts by setting `strictPort: false`
- Check if other services are using the same port

#### 3. HMR Working Partially

If HMR connects but doesn't reload changes:

- Check the browser console for more specific errors
- Try running `./check-vite-apps.sh` to analyze your Vite application setup
- Use `node test-websocket-client.js` to test the WebSocket connection directly

## Environment Detection

The fix automatically detects the Replit environment type:

- Standard Replit environments (`.replit.dev` domains)
- Classic Replit (`.repl.co` domains)
- Janeway environment (specific to Replit's Janeway system)
- Nix-based environments

## Advanced Configuration

The enhanced plugin supports additional configuration options:

```js
enhancedViteHmrFixPlugin({
  verbose: true,  // Enable verbose logging for debugging
})
```

## Testing Your WebSocket Connection

Use the included test client to verify WebSocket connectivity:

```bash
node test-websocket-client.js
```

This will attempt to connect to your application's WebSocket server and report any issues encountered.