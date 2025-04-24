import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { gql } from 'graphql-tag';

// Define the schema for this subgraph
const typeDefs = gql`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable"])

  type Query {
    serviceInfo: ServiceInfo
    users: [User]
    user(id: ID!): User
  }

  type ServiceInfo @shareable {
    name: String
    version: String
    status: String
  }

  type User @key(fields: "id") {
    id: ID!
    username: String
    email: String
    role: String
  }
`;

// Sample data
const users = [
  { id: '1', username: 'john.doe', email: 'john.doe@example.com', role: 'admin' },
  { id: '2', username: 'jane.smith', email: 'jane.smith@example.com', role: 'user' },
  { id: '3', username: 'bob.johnson', email: 'bob.johnson@example.com', role: 'user' },
];

// Define resolvers
const resolvers = {
  Query: {
    serviceInfo: () => ({ name: 'Backend Service', version: '1.0.0', status: 'healthy' }),
    users: () => users,
    user: (_, { id }) => users.find(user => user.id === id),
  },
  User: {
    __resolveReference: (reference) => {
      return users.find(user => user.id === reference.id);
    }
  }
};

// Create the Apollo Server
const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
});

// Start the server
async function startServer() {
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4001 },
  });
  console.log(`🚀 Backend subgraph ready at ${url}`);
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export { server, startServer };