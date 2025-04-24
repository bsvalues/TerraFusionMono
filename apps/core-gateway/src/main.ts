import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';

const gateway = new ApolloGateway({
  supergraphSdl: new IntrospectAndCompose({
    subgraphs: [
      { name: 'backend', url: 'http://localhost:4001/graphql' },
      { name: 'gisHub', url: 'http://localhost:4002/graphql' },
      { name: 'levyCalc', url: 'http://localhost:4003/graphql' }
    ],
  }),
});

const server = new ApolloServer({ gateway });

async function startGateway() {
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });

  console.log(`🚀 Federation gateway ready at ${url}`);
}

// Start the gateway if this file is run directly
if (require.main === module) {
  startGateway();
}

export { server, startGateway };