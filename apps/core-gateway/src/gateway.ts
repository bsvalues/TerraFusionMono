import { ApolloGateway, IntrospectAndCompose, RemoteGraphQLDataSource } from '@apollo/gateway';
import { ApolloServer } from '@apollo/server';
import fastify from 'fastify';
import { fastifyApollo } from '@as-integrations/fastify';
import fastifyHealthcheck from 'fastify-healthcheck';
import fs from 'fs';
import path from 'path';

interface Subgraph {
  name: string;
  url: string;
  enabled: boolean;
}

interface SubgraphsConfig {
  subgraphs: Subgraph[];
}

// Custom DataSource class that adds headers to requests
class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  willSendRequest({ request, context }: any) {
    // Forward authorization headers from client to services
    if (context.authorization) {
      request.http.headers.set('Authorization', context.authorization);
    }

    // Add service context information
    request.http.headers.set('x-gateway-source', 'terrafusion-core-gateway');
  }
}

// Load the subgraphs configuration file
const loadSubgraphsConfig = (): SubgraphsConfig => {
  try {
    const configPath = path.resolve(__dirname, 'graphql', 'subgraphs.config.json');
    const configJson = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configJson) as SubgraphsConfig;
  } catch (error) {
    console.error(`Failed to load subgraphs configuration: ${error}`);
    return { subgraphs: [] };
  }
};

// Start the gateway server
export async function startGateway() {
  const config = loadSubgraphsConfig();
  const enabledSubgraphs = config.subgraphs.filter(sg => sg.enabled);

  if (enabledSubgraphs.length === 0) {
    console.error('No enabled subgraphs found in configuration');
    process.exit(1);
  }

  console.log(`Initializing gateway with ${enabledSubgraphs.length} subgraphs:`);
  enabledSubgraphs.forEach(sg => console.log(` - ${sg.name}: ${sg.url}`));

  // Create the gateway with the loaded configuration
  const gateway = new ApolloGateway({
    supergraphSdl: new IntrospectAndCompose({
      subgraphs: enabledSubgraphs.map(sg => ({ name: sg.name, url: sg.url })),
      // Introspection options
      subgraphErrorPolicy: 'ignore', // Continue starting up even if some subgraphs are unreachable
      pollIntervalInMs: 60000, // Re-fetch the schema if a request fails
    }),
    buildService({ url }) {
      return new AuthenticatedDataSource({ url });
    },
  });

  // Initialize the ApolloServer
  const server = new ApolloServer({
    gateway,
    introspection: true, // Enable schema introspection for development
    apollo: {
      key: process.env.APOLLO_KEY,
      graphRef: process.env.APOLLO_GRAPH_REF,
    },
    plugins: [
      // Add monitoring plugins here if needed
    ],
  });

  // Wait for the server to start
  await server.start();

  // Create the Fastify app
  const app = fastify();

  // Register health check endpoints
  app.register(fastifyHealthcheck, {
    exposeUptime: true,
    healthcheckUrl: '/health/live',
    healthcheckUrlDisable: false,
    healthcheckUrlAlwaysOk: false,
    underPressureOptions: {
      maxEventLoopUtilization: 0.98,
    },
  });

  // Add a detailed health check for GraphQL services
  app.get('/health/ready', async (request, reply) => {
    try {
      const subgraphStatus = await Promise.all(
        enabledSubgraphs.map(async (sg) => {
          try {
            const res = await fetch(`${sg.url}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: '{ __typename }' }),
            });
            const status = res.status >= 200 && res.status < 300 ? 'healthy' : 'unhealthy';
            return { name: sg.name, url: sg.url, status, statusCode: res.status };
          } catch (error) {
            return { name: sg.name, url: sg.url, status: 'unreachable', error: error.message };
          }
        })
      );

      const allHealthy = subgraphStatus.every(sg => sg.status === 'healthy');
      
      reply.code(allHealthy ? 200 : 207);
      return {
        status: allHealthy ? 'ready' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        subgraphs: subgraphStatus,
      };
    } catch (error) {
      reply.code(500);
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  });

  // Register the Apollo Server with Fastify
  app.register(fastifyApollo(server), {
    context: async (request) => {
      // Extract authorization headers from request
      const authorization = request.headers.authorization || '';
      return { authorization };
    },
  });

  // Start the server
  const port = process.env.PORT || 4000;
  try {
    await app.listen({ port: Number(port), host: '0.0.0.0' });
    console.log(`🚀 TerraFusion Federation Gateway ready at http://localhost:${port}/graphql`);
    console.log(`🩺 Health checks available at:`);
    console.log(`   - Live: http://localhost:${port}/health/live`);
    console.log(`   - Ready: http://localhost:${port}/health/ready`);
  } catch (error) {
    console.error('Failed to start gateway server:', error);
    process.exit(1);
  }
}