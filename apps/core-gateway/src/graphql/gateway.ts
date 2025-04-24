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
const subgraphs = Object.entries(subgraphsConfig).map(([name, url]) => ({
  name,
  url: url as string,
}));

// Create the Apollo Gateway instance
export const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs,
  }),
});

// Plugin to register the Apollo Gateway with Fastify
export const apolloGatewayPlugin = fastifyPlugin(async (fastify: FastifyInstance) => {
  // Create the Apollo Server
  const server = new ApolloServer({
    gateway,
    plugins: [fastifyApolloDrainPlugin(fastify)],
  });

  // Start the Apollo Server
  await server.start();

  // Register a route handler for GraphQL requests
  fastify.route({
    method: ['POST', 'GET'],
    url: '/graphql',
    handler: async (request, reply) => {
      const { body, headers } = request;
      
      const result = await server.executeOperation({
        query: typeof body === 'string' ? body : (body as any)?.query || '',
        variables: (body as any)?.variables,
        operationName: (body as any)?.operationName,
        contextValue: {
          request,
          headers
        },
      });

      reply.status(200).send(result);
    },
  });

  // Register a shutdown hook
  fastify.addHook('onClose', async () => {
    await server.stop();
  });

  fastify.log.info('🚀 Apollo Federation Gateway registered');
});

export default apolloGatewayPlugin;