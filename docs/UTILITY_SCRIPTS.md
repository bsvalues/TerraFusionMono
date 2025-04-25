# TerraFusionMono Utility Scripts

This document describes the various utility scripts available in the TerraFusionMono repository to help with common tasks.

## Repository Import Scripts

### import-repos.sh

Main script to import all Terra repositories.

```bash
./import-repos.sh
```

### import-bcbs-repos.sh

Specifically imports BCBS-prefixed repositories.

```bash
./import-bcbs-repos.sh
```

### import-remaining-repos.sh

Imports repositories that haven't been imported yet.

```bash
./import-remaining-repos.sh
```

### import-single-repo.sh

Imports a single repository by name.

```bash
./import-single-repo.sh RepositoryName
```

## Repository Status Scripts

### check-repos-status.sh

Scans all repositories in the workspace and provides a status report on each one.

```bash
./check-repos-status.sh
```

**Features:**
- Checks if the repository directory exists
- Verifies if package.json is present
- Reports on dependencies
- Checks for source files
- Identifies GraphQL schemas

### check-vite-apps.sh

Identifies Vite applications that might need WebSocket fixes for Replit.

```bash
./check-vite-apps.sh
```

**Features:**
- Detects Vite applications in the monorepo
- Checks if the WebSocket HMR fix is applied
- Provides instructions for adding the fix to applications that need it

## Gateway Management Scripts

### start-gateway.sh

Starts the Apollo Federation Gateway service.

```bash
./start-gateway.sh
```

### update-gateway-config.sh

Scans the monorepo for GraphQL services and updates the gateway configuration.

```bash
./update-gateway-config.sh
```

**Features:**
- Identifies potential GraphQL services
- Updates the gateway configuration with new services
- Assigns unique port numbers to new services
- Creates a backup of the existing configuration

## WebSocket Testing Scripts

### test-websocket-client.js

Tests WebSocket connections in the Replit environment.

```bash
node test-websocket-client.js [optional-url]
```

**Features:**
- Automatically detects the Replit environment
- Sends test messages over WebSocket
- Provides diagnostic information for connection issues
- Tests HTTPS connectivity when WebSocket connection fails

## Best Practices

1. **Run check scripts first**: Before making changes, run the appropriate check scripts to understand the current state of the monorepo.

2. **Keep configurations backed up**: The update scripts automatically create backups, but it's good practice to manually back up important files before major changes.

3. **Verify gateway changes**: After updating the gateway configuration, verify that all services are correctly registered by checking the gateway's GraphQL playground.

4. **Test WebSocket connections**: Use the WebSocket testing tools to verify that HMR works correctly in Vite applications.

5. **Update documentation**: When adding new repositories or services, remember to update the relevant documentation files.

## Troubleshooting

If scripts fail with permission errors, ensure they're executable:

```bash
chmod +x script-name.sh
```

If JSON parsing fails, install jq for better results:

```bash
apt-get install jq
```

For more detailed logging, most scripts support a verbose mode:

```bash
./script-name.sh --verbose
```