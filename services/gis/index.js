import { readFileSync } from 'fs';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { resolvers } from './resolvers.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the schema
const typeDefs = readFileSync(join(__dirname, 'schema.graphql'), 'utf8');

// Create the Apollo Server with Federation
const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
});

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const { url } = await startStandaloneServer(server, {
    listen: { port: process.env.PORT || 4003 },
    context: async ({ req }) => {
      // You can add authentication/authorization logic here
      return { };
    },
  });
  
  console.log(`🚀 GIS subgraph service ready at ${url}`);
}

export default server;