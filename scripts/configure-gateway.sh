#!/usr/bin/env bash
set -euo pipefail

# TerraFusion Apollo Gateway Configuration Script
# This script configures the Apollo Federation Gateway
# Author: TerraFusion DevOps Agent
# Date: April 28, 2025

# Color codes for better output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Function for success messages
success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function for error messages
error() {
  echo -e "${RED}✗ $1${NC}"
  exit 1
}

# Function for informational messages
info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

# Ensure we're in the monorepo root
if [ ! -f "nx.json" ]; then
  error "Please run this from the TerraFusionMono repo root"
fi

# Check if core-gateway exists
if [ ! -d "apps/core-gateway" ]; then
  error "Core Gateway directory not found at apps/core-gateway"
fi

# Create the gateway directory structure if needed
info "Setting up Core Gateway directory structure..."
mkdir -p apps/core-gateway/src/graphql

# Define Gateway configuration template
GATEWAY_CONFIG_FILE="apps/core-gateway/src/graphql/subgraphs.config.json"

# Check if the configuration file already exists
if [ -f "$GATEWAY_CONFIG_FILE" ]; then
  info "Existing gateway configuration found at $GATEWAY_CONFIG_FILE"
  info "Backing up existing configuration..."
  cp "$GATEWAY_CONFIG_FILE" "${GATEWAY_CONFIG_FILE}.bak"
else
  info "Creating new gateway configuration..."
fi

# Create the subgraphs configuration
cat > "$GATEWAY_CONFIG_FILE" << EOF
{
  "subgraphs": [
    {
      "name": "terralegislativepulsepub",
      "url": "http://localhost:4001/graphql",
      "enabled": true
    },
    {
      "name": "terraagent",
      "url": "http://localhost:4002/graphql",
      "enabled": true
    },
    {
      "name": "terraf",
      "url": "http://localhost:4003/graphql",
      "enabled": true
    },
    {
      "name": "terraflow",
      "url": "http://localhost:4004/graphql",
      "enabled": true
    },
    {
      "name": "terrafusionpro",
      "url": "http://localhost:4005/graphql",
      "enabled": true
    },
    {
      "name": "terrafusionsync",
      "url": "http://localhost:4006/graphql",
      "enabled": true
    },
    {
      "name": "terraminer",
      "url": "http://localhost:4007/graphql",
      "enabled": true
    },
    {
      "name": "bcbscostapp",
      "url": "http://localhost:4008/graphql",
      "enabled": true
    },
    {
      "name": "bcbsgispro",
      "url": "http://localhost:4009/graphql",
      "enabled": true
    },
    {
      "name": "bcbslevy",
      "url": "http://localhost:4010/graphql",
      "enabled": true
    },
    {
      "name": "bcbswebhub",
      "url": "http://localhost:4011/graphql",
      "enabled": true
    },
    {
      "name": "bsbcmaster",
      "url": "http://localhost:4012/graphql",
      "enabled": true
    },
    {
      "name": "bsincomevaluation",
      "url": "http://localhost:4013/graphql",
      "enabled": true
    }
  ]
}
EOF

success "Gateway configuration created at $GATEWAY_CONFIG_FILE"

# Create gateway.ts if needed
GATEWAY_TS_FILE="apps/core-gateway/src/graphql/gateway.ts"
if [ ! -f "$GATEWAY_TS_FILE" ]; then
  info "Creating Gateway implementation file at $GATEWAY_TS_FILE..."
  
  cat > "$GATEWAY_TS_FILE" << EOF
import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';
import { ApolloServer } from '@apollo/server';
import { fastifyApolloDrainPlugin } from '@as-integrations/fastify';
import { FastifyInstance } from 'fastify';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import fastifyPlugin from 'fastify-plugin';

// Import the subgraphs configuration
const subgraphsConfig = JSON.parse(
  readFileSync(resolve(__dirname, 'subgraphs.config.json'), 'utf-8')
);

// Build the subgraphs array for the gateway
const subgraphs = subgraphsConfig.subgraphs
  .filter(subgraph => subgraph.enabled)
  .map(subgraph => ({
    name: subgraph.name,
    url: subgraph.url
  }));

// Create the gateway plugin
export const gatewayPlugin = fastifyPlugin(async (fastify: FastifyInstance) => {
  // Create the federated gateway
  const gateway = new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({
      subgraphs,
      pollIntervalInMs: process.env.NODE_ENV === 'development' ? 5000 : 30000,
    }),
    debug: process.env.NODE_ENV === 'development',
  });

  // Initialize Apollo Server
  const server = new ApolloServer({
    gateway,
    plugins: [fastifyApolloDrainPlugin(fastify)],
  });

  // Wait for gateway to be ready
  await server.start();

  // Register health check endpoints
  fastify.get('/health/live', async () => ({ status: 'ok' }));
  fastify.get('/health/ready', async () => {
    // Verify all subgraphs are reachable
    try {
      const healthStatus = await Promise.all(
        subgraphs.map(async (subgraph) => {
          try {
            const response = await fetch(\`\${subgraph.url.replace('/graphql', '')}/health\`);
            return { 
              name: subgraph.name, 
              status: response.ok ? 'ok' : 'error', 
              statusCode: response.status 
            };
          } catch (err) {
            return { name: subgraph.name, status: 'error', error: err.message };
          }
        })
      );
      
      const allHealthy = healthStatus.every(status => status.status === 'ok');
      
      return { 
        status: allHealthy ? 'ok' : 'degraded',
        subgraphs: healthStatus
      };
    } catch (err) {
      return { status: 'error', error: err.message };
    }
  });

  // Register hook to gracefully shut down gateway
  fastify.addHook('onClose', async () => {
    await server.stop();
  });

  // Return the Apollo Server instance
  return { apolloServer: server };
});
EOF

  success "Gateway implementation file created"
fi

# Create start-gateway.sh script if needed
GATEWAY_START_SCRIPT="./start-gateway.sh"
if [ ! -f "$GATEWAY_START_SCRIPT" ]; then
  info "Creating Gateway startup script..."
  
  cat > "$GATEWAY_START_SCRIPT" << EOF
#!/usr/bin/env bash
set -euo pipefail

# Color codes for better output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Function for section headers
section() {
  echo -e "\n\${BLUE}=== \$1 ===\${NC}"
}

# Function for success messages
success() {
  echo -e "\${GREEN}✓ \$1\${NC}"
}

# Function for error messages
error() {
  echo -e "\${RED}✗ \$1\${NC}"
  exit 1
}

# Function for informational messages
info() {
  echo -e "\${YELLOW}ℹ \$1\${NC}"
}

section "Starting Federation Gateway"

# Set the PORT environment variable if not already set
if [ -z "\$PORT" ]; then
  export PORT=4000
  info "Using default port: \$PORT"
else
  info "Using configured port: \$PORT"
fi

# Set node environment if not set
if [ -z "\$NODE_ENV" ]; then
  export NODE_ENV=development
  info "Using default environment: \$NODE_ENV"
else
  info "Using configured environment: \$NODE_ENV"
fi

# Ensure gateway directory is the working directory for correct relative paths
cd "apps/core-gateway" || { error "Failed to change to gateway directory"; exit 1; }

info "Starting Apollo Federation Gateway..."
info "Press Ctrl+C to stop the gateway"

# Start the gateway using the appropriate method
if command -v nx &> /dev/null; then
  # If nx is available
  cd ../..
  info "Starting with Nx: nx serve core-gateway"
  nx serve core-gateway
else
  # Fallback to npm
  info "Starting with npm: npm run start"
  npm run start
fi
EOF

  chmod +x "$GATEWAY_START_SCRIPT"
  success "Gateway startup script created and made executable"
fi

# Verify Gateway configuration
info "Verifying Gateway configuration..."
if [ -f "$GATEWAY_CONFIG_FILE" ] && [ -f "$GATEWAY_TS_FILE" ]; then
  success "Gateway configuration verified successfully"
else
  error "Gateway configuration verification failed"
fi

# Done
echo -e "\n${GREEN}Apollo Federation Gateway has been successfully configured!${NC}"
echo -e "${YELLOW}You can start the gateway by running: ./start-gateway.sh${NC}"