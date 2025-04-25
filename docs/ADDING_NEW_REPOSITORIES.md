# Adding New Repositories to TerraFusionMono

This guide provides step-by-step instructions for adding a new repository to the TerraFusionMono monorepo.

## Prerequisites

Before adding a new repository, ensure you have:

- Access to the repository you want to import
- Necessary permissions in the TerraFusionMono repository
- A basic understanding of Nx workspace concepts

## Step 1: Import the Repository

Use the provided script to import a single repository:

```bash
./import-single-repo.sh RepositoryName
```

Replace `RepositoryName` with the name of your repository. The script will:
1. Clone the repository
2. Normalize the name (lowercase with dashes)
3. Move it to the `apps/` directory
4. Remove the `.git` directory
5. Update `workspace.json` to register it

## Step 2: Update Dependencies

After importing, you need to ensure all dependencies are correctly installed:

1. Check for dependency differences between the imported repository and the monorepo:

   ```bash
   cd apps/your-repo-name
   cat package.json
   ```

2. Install any missing dependencies using the package manager tool:

   ```bash
   npm install --save your-dependency
   ```

## Step 3: Configure for Monorepo

Update the imported repository's configuration to work within the monorepo:

1. Update any hardcoded paths to use relative paths:

   ```javascript
   // Before
   import { something } from '/absolute/path/to/module';
   
   // After
   import { something } from '../../path/to/module';
   ```

2. Update port configurations to avoid conflicts with other services:

   ```javascript
   // Choose a unique port that's not used by other services
   const PORT = process.env.PORT || 4xxx; // where xxx is unique
   ```

## Step 4: Register with Gateway (for GraphQL Services)

If your repository includes a GraphQL service, register it with the Apollo Federation Gateway:

1. Ensure your service implements the Federation specification:

   ```javascript
   import { buildSubgraphSchema } from '@apollo/subgraph';
   
   const schema = buildSubgraphSchema({
     typeDefs,
     resolvers
   });
   ```

2. Update the gateway configuration in `apps/core-gateway/src/graphql/subgraphs.config.json`:

   ```json
   {
     "backend": "http://localhost:4001/graphql",
     "existing": "http://localhost:4002/graphql",
     "yourService": "http://localhost:4xxx/graphql" // Add your service
   }
   ```

## Step 5: Test Your Integration

Test that the imported repository works correctly within the monorepo:

1. Build the project:

   ```bash
   nx build your-repo-name
   ```

2. Start the service:

   ```bash
   nx serve your-repo-name
   ```

3. If applicable, test with the gateway:

   ```bash
   ./start-gateway.sh
   ```

## Step 6: Add WebSocket Fix (for Vite Applications)

If your repository uses Vite, add the WebSocket fix to ensure it works in Replit:

1. Include the WebSocket fix script in your HTML:

   ```html
   <script src="/vite-hmr-fix.js"></script>
   ```

2. Update your Vite configuration to use the fix plugin:

   ```javascript
   import viteHmrFixPlugin from '../../../vite-hmr-fix-plugin.js';
   
   export default defineConfig({
     plugins: [
       // other plugins...
       viteHmrFixPlugin(),
     ],
   });
   ```

## Common Issues

### Path Resolution Problems

If you encounter path resolution issues:

```
Error: Cannot find module '../../some/path'
```

Solution: Verify the relative paths and adjust as needed.

### Port Conflicts

If you see:

```
Error: listen EADDRINUSE: address already in use :::4000
```

Solution: Change the port in your service configuration.

### Gateway Integration Issues

If your service doesn't appear in the gateway:

1. Verify that your service is running and accessible
2. Check that the URL in `subgraphs.config.json` is correct
3. Ensure your service implements the Federation specification correctly

## Best Practices

1. Keep repository names consistent (lowercase with dashes)
2. Ensure each service has a unique port number
3. Use relative imports within the monorepo
4. Add proper documentation for your service in the `docs/` directory
5. Update the main README.md to reference your new repository