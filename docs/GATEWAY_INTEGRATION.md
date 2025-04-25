# Apollo Federation Gateway Integration Guide

This document explains how to set up and integrate services with the Apollo Federation Gateway in the TerraFusionMono repository.

## Overview

The TerraFusionMono repository uses Apollo Federation to combine multiple GraphQL services into a unified API gateway. This architecture allows teams to work independently on their services while providing a single entry point for clients.

## Gateway Configuration

The gateway is located in `apps/core-gateway` and is configured to connect to multiple subgraph services.

### Key Files

- `apps/core-gateway/src/main.ts` - Contains the gateway setup and server configuration
- `apps/core-gateway/src/graphql/subgraphs.config.json` - Defines the subgraph services to connect to
- `start-gateway.sh` - Script to start the gateway service

## Adding a New Service to the Gateway

To add a new service to the Federation Gateway:

1. **Create Your GraphQL Service**

   Ensure your service follows the Apollo Federation subgraph specification:
   
   ```js
   // Example: apps/your-service/src/graphql/schema.js
   import { buildSubgraphSchema } from '@apollo/subgraph';
   import typeDefs from './typeDefs';
   import resolvers from './resolvers';
   
   export const schema = buildSubgraphSchema({
     typeDefs,
     resolvers
   });
   ```

2. **Expose the Federation-ready Schema**

   Make sure your service exposes the `_service` field and federation directives:
   
   ```graphql
   # In your type definitions
   extend type Query {
     _service: _Service!
   }
   
   type _Service {
     sdl: String!
   }
   ```

3. **Add Your Service to the Subgraphs Configuration**

   Edit `apps/core-gateway/src/graphql/subgraphs.config.json` to add your service:
   
   ```json
   {
     "backend": "http://localhost:4001/graphql",
     "yourService": "http://localhost:4XXX/graphql"
   }
   ```

4. **Update the Gateway Implementation**

   Edit `apps/core-gateway/src/main.ts` to include your service in the subgraphs array:
   
   ```js
   subgraphs: [
     { name: 'backend', url: 'http://localhost:4001/graphql' },
     { name: 'yourService', url: 'http://localhost:4XXX/graphql' }
   ]
   ```

5. **Assign a Unique Port**

   Ensure your service runs on a unique port (4XXX) that doesn't conflict with existing services.

## Testing the Gateway

1. Start your subgraph service:
   ```
   nx serve your-service
   ```

2. Start the gateway:
   ```
   ./start-gateway.sh
   ```

3. Access the gateway GraphQL playground at `http://localhost:4000/graphql`

## Troubleshooting

If the gateway fails to connect to your service:

1. **Check Service Health**
   
   The gateway has health checks configured at:
   - `http://localhost:4000/health/live` - Checks if the gateway is running
   - `http://localhost:4000/health/ready` - Checks if the gateway can connect to all subgraphs

2. **Verify Service URL**
   
   Make sure your service is running and accessible at the URL specified in the configuration.

3. **Check Federation Directives**
   
   Ensure your service properly implements the federation specification with the required directives.

## Best Practices

1. **Use Entity References**
   
   For entities that span multiple services, use the `@key` directive and implement the `__resolveReference` resolver.

2. **Avoid Schema Conflicts**
   
   Coordinate with other teams to avoid naming conflicts in the unified schema.

3. **Implement Health Checks**
   
   Ensure your service has a `/health/ready` endpoint that returns a 200 status when it's ready to serve requests.