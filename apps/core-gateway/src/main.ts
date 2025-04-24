import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloGateway, IntrospectAndCompose, GraphQLDataSource } from '@apollo/gateway';
import express from 'express';
import http from 'http';
import cors from 'cors';
import fetch from 'node-fetch';
import { json } from 'body-parser';
import { ServiceEndpointDefinition } from '@apollo/gateway';

// Create a custom GraphQL data source with health check capability
class HealthAwareDataSource extends GraphQLDataSource {
  private serviceUrl: string;

  constructor(url: string) {
    super();
    this.serviceUrl = url;
  }

  async checkHealthCheck(): Promise<boolean> {
    if (!this.serviceUrl) return false;
    try {
      const healthUrl = this.serviceUrl.replace('graphql', 'health/ready');
      const response = await fetch(healthUrl);
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  // Required method from GraphQLDataSource
  async process(request: any) {
    return super.process(request);
  }
}

// Gateway configuration
const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: 'backend', url: 'http://localhost:4001/graphql' },
      { name: 'gisHub', url: 'http://localhost:4002/graphql' },
      { name: 'levyCalc', url: 'http://localhost:4003/graphql' }
    ],
  }),
  // Add a custom data source with health check capability
  buildService({ url }: ServiceEndpointDefinition) {
    return new HealthAwareDataSource(url);
  }
});

// Store service instances for health checks
let serviceInstances: HealthAwareDataSource[] = [];

// Create Apollo Server
const server = new ApolloServer({
  gateway,
  plugins: [
    {
      async serverWillStart() {
        console.log('🔍 Checking subgraph health...');
        
        // Store service instances when the server starts
        if (gateway.serviceMap) {
          serviceInstances = Object.values(gateway.serviceMap).filter(
            (service): service is HealthAwareDataSource => service instanceof HealthAwareDataSource
          );
        }
        
        return {
          async drainServer() {
            console.log('🛑 Shutting down server...');
          }
        };
      }
    }
  ]
});

// Start gateway with Express
async function startGateway() {
  // Create Express app and HTTP server
  const app = express();
  const httpServer = http.createServer(app);

  // Health check endpoints
  app.get('/health/live', (req, res) => {
    res.status(200).send({ status: 'ok' });
  });

  app.get('/health/ready', async (req, res) => {
    try {
      // Check gateway status
      let gatewayReady = false;
      try {
        server.assertStarted();
        gatewayReady = true;
      } catch {
        gatewayReady = false;
      }
      
      // Check subgraph health
      const subgraphsUp = await Promise.all(
        serviceInstances.map(service => service.checkHealthCheck())
      );
      
      const allSubgraphsUp = subgraphsUp.length > 0 && subgraphsUp.every(Boolean);
      
      if (gatewayReady && allSubgraphsUp) {
        res.status(200).send({ status: 'ready', subgraphs: 'healthy' });
      } else {
        res.status(503).send({ 
          status: 'not ready', 
          gateway: gatewayReady ? 'up' : 'down',
          subgraphs: allSubgraphsUp ? 'healthy' : 'unhealthy'
        });
      }
    } catch (error: any) {
      res.status(500).send({ 
        status: 'error', 
        message: error.message || 'Unknown error' 
      });
    }
  });

  // Start the Apollo Server
  await server.start();

  // Apply middleware
  app.use(
    '/graphql',
    cors(),
    json(),
    expressMiddleware(server)
  );

  // Start HTTP server
  await new Promise<void>((resolve) => {
    httpServer.listen({ port: 4000 }, () => resolve());
  });
  
  console.log(`🚀 Federation gateway ready at http://localhost:4000/graphql`);
  console.log(`🩺 Health checks available at /health/live and /health/ready`);
  
  return { server, app, httpServer };
}

// Start the gateway if this file is run directly
if (require.main === module) {
  startGateway();
}

export { server, startGateway };