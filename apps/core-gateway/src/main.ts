import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';
import express from 'express';
import http from 'http';
import cors from 'cors';
import fetch from 'node-fetch';
import { json } from 'body-parser';

// Gateway configuration
const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: 'backend', url: 'http://localhost:4001/graphql' },
      { name: 'gisHub', url: 'http://localhost:4002/graphql' },
      { name: 'levyCalc', url: 'http://localhost:4003/graphql' }
    ],
  }),
  // Add a plugin for health checks
  buildService({ url }) {
    return {
      url,
      async checkHealthCheck() {
        try {
          const response = await fetch(`${url.replace('graphql', 'health/ready')}`);
          return response.ok;
        } catch (e) {
          return false;
        }
      }
    };
  }
});

// Create Apollo Server
const server = new ApolloServer({
  gateway,
  plugins: [
    {
      async serverWillStart() {
        console.log('🔍 Checking subgraph health...');
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
      const gatewayReady = server.assertStarted();
      
      // Check subgraph health
      const subgraphsUp = await Promise.all(
        gateway.serviceList?.map(service => service.checkHealthCheck?.()) || []
      );
      
      const allSubgraphsUp = subgraphsUp.every(Boolean);
      
      if (gatewayReady && allSubgraphsUp) {
        res.status(200).send({ status: 'ready', subgraphs: 'healthy' });
      } else {
        res.status(503).send({ 
          status: 'not ready', 
          gateway: gatewayReady ? 'up' : 'down',
          subgraphs: allSubgraphsUp ? 'healthy' : 'unhealthy'
        });
      }
    } catch (error) {
      res.status(500).send({ status: 'error', message: error.message });
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
  await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
  console.log(`🚀 Federation gateway ready at http://localhost:4000/graphql`);
  console.log(`🩺 Health checks available at /health/live and /health/ready`);
  
  return { server, app, httpServer };
}

// Start the gateway if this file is run directly
if (require.main === module) {
  startGateway();
}

export { server, startGateway };