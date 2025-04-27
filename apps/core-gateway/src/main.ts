import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloGateway, IntrospectAndCompose, GraphQLDataSource, RemoteGraphQLDataSource } from '@apollo/gateway';
import express from 'express';
import http from 'http';
import cors from 'cors';
import fetch from 'node-fetch';
import { json } from 'body-parser';
import { ServiceEndpointDefinition } from '@apollo/gateway';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load the subgraphs configuration
let subgraphsConfig: { subgraphs: Array<{ name: string; url: string; enabled: boolean }> };

try {
  const configPath = resolve(__dirname, 'graphql/subgraphs.config.json');
  console.log(`📖 Loading subgraphs config from ${configPath}`);
  const configData = readFileSync(configPath, 'utf-8');
  subgraphsConfig = JSON.parse(configData);
  console.log(`✅ Found ${subgraphsConfig.subgraphs.length} subgraphs in config`);
} catch (error) {
  console.error('❌ Error loading subgraphs config:', error);
  subgraphsConfig = { subgraphs: [] };
}

// Filter to only enabled subgraphs
const enabledSubgraphs = subgraphsConfig.subgraphs
  .filter(subgraph => subgraph.enabled)
  .map(({ name, url }) => ({ name, url }));

console.log(`🔗 Enabled subgraphs: ${enabledSubgraphs.length}`);
enabledSubgraphs.forEach(({ name, url }) => {
  console.log(`  - ${name}: ${url}`);
});

// Create a custom GraphQL data source with health check capability
class EnhancedDataSource extends RemoteGraphQLDataSource {
  // Make this public so it can be accessed for health check reporting
  public readonly serviceName: string;
  
  constructor(url: string, name: string) {
    super({ url });
    this.serviceName = name;
  }

  async checkHealthCheck(): Promise<boolean> {
    if (!this.url) return false;
    try {
      const healthUrl = this.url.replace('graphql', 'health/ready');
      console.log(`🩺 Checking health for ${this.serviceName} at ${healthUrl}`);
      const response = await fetch(healthUrl);
      const isHealthy = response.ok;
      console.log(`${isHealthy ? '✅' : '❌'} ${this.serviceName} is ${isHealthy ? 'healthy' : 'unhealthy'}`);
      return isHealthy;
    } catch (e) {
      console.log(`❌ Health check failed for ${this.serviceName}:`, e);
      return false;
    }
  }

  async willSendRequest({ request, context }: any) {
    // Forward authorization headers from client to services
    if (context?.authorization) {
      request.http.headers.set('Authorization', context.authorization);
    }

    // Add service context information
    request.http.headers.set('x-gateway-source', 'terrafusion-core-gateway');
    request.http.headers.set('x-service-name', this.serviceName);
  }
}

// Gateway configuration
const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: enabledSubgraphs,
  }),
  // Add a custom data source with health check capability
  buildService({ name, url }: ServiceEndpointDefinition) {
    return new EnhancedDataSource(url || '', name);
  }
});

// Store service instances for health checks
let serviceInstances: EnhancedDataSource[] = [];

// Create Apollo Server
const server = new ApolloServer({
  gateway,
  plugins: [
    {
      async serverWillStart() {
        console.log('🔍 Checking subgraph health...');
        
        // Create instances for each enabled subgraph
        serviceInstances = enabledSubgraphs.map(
          ({ name, url }) => new EnhancedDataSource(url, name)
        );
        
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

  // Add basic security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Add request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`📊 ${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    });
    next();
  });

  // Add CORS pre-flight route
  app.options('*', cors());

  // Add GraphQL playground
  app.get('/graphql-playground', (req, res) => {
    res.set('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>TerraFusion GraphQL Playground</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/static/css/index.css" />
          <script src="https://cdn.jsdelivr.net/npm/graphql-playground-react/build/static/js/middleware.js"></script>
        </head>
        <body>
          <div id="root">
            <div class="loading-container">
              <div class="loading">
                <span>Loading TerraFusion GraphQL Playground...</span>
              </div>
            </div>
          </div>
          <script>
            window.addEventListener('load', function (event) {
              const root = document.getElementById('root');
              const loadingWrapper = document.querySelector('.loading-container');
              loadingWrapper.classList.add('fadeOut');
              
              GraphQLPlayground.init(root, {
                endpoint: '/graphql',
                settings: {
                  'request.credentials': 'include',
                  'general.betaUpdates': false,
                  'editor.theme': 'dark',
                  'editor.reuseHeaders': true,
                  'tracing.hideTracingResponse': false,
                  'editor.fontSize': 14,
                  'editor.fontFamily': "'Source Code Pro', 'Consolas', 'Inconsolata', 'Droid Sans Mono', 'Monaco', monospace",
                }
              });
            });
          </script>
        </body>
      </html>
    `);
  });

  // Add gateway info endpoint
  app.get('/info', (req, res) => {
    res.json({
      name: 'TerraFusion GraphQL Federation Gateway',
      version: '1.0.0',
      status: 'running',
      subgraphs: enabledSubgraphs.map(({ name, url }) => ({ name, url }))
    });
  });

  // Health check endpoints
  app.get('/health/live', (req, res) => {
    res.status(200).send({ status: 'ok' });
  });

  app.get('/health/ready', async (req, res) => {
    try {
      // Check gateway status
      let gatewayReady = false;
      try {
        // Since Apollo Server v4 doesn't expose state directly, we'll just assume it's running
        // if we got this far in the code
        gatewayReady = true;
      } catch {
        gatewayReady = false;
      }
      
      // Check subgraph health with timeout
      const checkWithTimeout = async (service: EnhancedDataSource) => {
        try {
          const timeoutPromise = new Promise<boolean>((resolve) => {
            setTimeout(() => resolve(false), 1000);
          });
          return await Promise.race([service.checkHealthCheck(), timeoutPromise]);
        } catch {
          return false;
        }
      };
      
      // Check all subgraphs in parallel
      const subgraphsStatus = await Promise.all(
        serviceInstances.map(async (service) => {
          const isUp = await checkWithTimeout(service);
          return { name: service.serviceName, status: isUp ? 'up' : 'down' };
        })
      );
      
      const allSubgraphsUp = subgraphsStatus.length > 0 && 
                            subgraphsStatus.every(s => s.status === 'up');
      
      if (gatewayReady && allSubgraphsUp) {
        res.status(200).send({ 
          status: 'ready', 
          gateway: 'up',
          subgraphs: subgraphsStatus 
        });
      } else {
        res.status(503).send({ 
          status: 'not ready', 
          gateway: gatewayReady ? 'up' : 'down',
          subgraphs: subgraphsStatus
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
  console.log('🚀 Starting Apollo Server...');
  try {
    await server.start();
    console.log('✅ Apollo Server started successfully');
  } catch (error) {
    console.error('❌ Failed to start Apollo Server:', error);
    throw error;
  }

  // Apply middleware
  app.use(
    '/graphql',
    cors(),
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        // Create context for each request
        const authorization = req.headers.authorization || '';
        return { authorization };
      }
    })
  );

  // Set up error handling for unhandled routes
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', message: `Route ${req.path} not found` });
  });

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: err.message || 'Unknown error'
    });
  });

  // Start HTTP server
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
  const host = process.env.HOST || '0.0.0.0';

  try {
    await new Promise<void>((resolve, reject) => {
      httpServer.listen({ port, host }, () => resolve());
      httpServer.on('error', (err) => {
        console.error('❌ Failed to start HTTP server:', err);
        reject(err);
      });
    });
    
    console.log(`🚀 Federation gateway ready at http://${host}:${port}/graphql`);
    console.log(`🎮 GraphQL Playground available at http://${host}:${port}/graphql-playground`);
    console.log(`🩺 Health checks available at http://${host}:${port}/health/live and http://${host}:${port}/health/ready`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    throw error;
  }
  
  // Set up graceful shutdown
  process.on('SIGTERM', () => shutdownGracefully(httpServer, server));
  process.on('SIGINT', () => shutdownGracefully(httpServer, server));
  
  return { server, app, httpServer };
}

// Helper for graceful shutdown
async function shutdownGracefully(httpServer: http.Server, apolloServer: ApolloServer) {
  console.log('🛑 Received shutdown signal, closing gracefully...');
  
  try {
    // First stop accepting new connections
    httpServer.close(() => {
      console.log('✅ HTTP server closed');
    });
    
    // Then stop Apollo Server
    await apolloServer.stop();
    console.log('✅ Apollo Server stopped');
    
    console.log('👋 Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Start the gateway if this file is run directly
if (require.main === module) {
  startGateway().catch((error) => {
    console.error('❌ Failed to start gateway:', error);
    process.exit(1);
  });
}

export { server, startGateway };