import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { gql } from 'graphql-tag';

// Define the schema for this subgraph
const typeDefs = gql`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable"])

  type Query {
    serviceInfo: ServiceInfo
    calculations: [LevyCalculation]
    calculation(id: ID!): LevyCalculation
    parcelCalculations(parcelId: ID!): [LevyCalculation]
  }

  type ServiceInfo @shareable {
    name: String
    version: String
    status: String
  }

  type LevyCalculation @key(fields: "id") {
    id: ID!
    parcelId: ID!
    landUse: String
    area: Float
    levyRate: Float
    totalLevy: Float
    calculatedAt: String
    status: String
  }

  extend type Parcel @key(fields: "id") {
    id: ID! @external
    levyCalculations: [LevyCalculation]
  }
`;

// Sample data
const calculations = [
  {
    id: '1',
    parcelId: '1',
    landUse: 'Agricultural',
    area: 150.5,
    levyRate: 2.5,
    totalLevy: 376.25,
    calculatedAt: '2025-04-10T15:30:00Z',
    status: 'approved',
  },
  {
    id: '2',
    parcelId: '1',
    landUse: 'Agricultural',
    area: 150.5,
    levyRate: 3.0,
    totalLevy: 451.5,
    calculatedAt: '2025-04-15T10:45:00Z',
    status: 'pending',
  },
  {
    id: '3',
    parcelId: '2',
    landUse: 'Pasture',
    area: 200.75,
    levyRate: 1.75,
    totalLevy: 351.31,
    calculatedAt: '2025-04-12T09:20:00Z',
    status: 'approved',
  },
];

// Define resolvers
const resolvers = {
  Query: {
    serviceInfo: () => ({ name: 'Levy Calculator Service', version: '1.0.0', status: 'healthy' }),
    calculations: () => calculations,
    calculation: (_, { id }) => calculations.find(calc => calc.id === id),
    parcelCalculations: (_, { parcelId }) => calculations.filter(calc => calc.parcelId === parcelId),
  },
  LevyCalculation: {
    __resolveReference: (reference) => {
      return calculations.find(calc => calc.id === reference.id);
    }
  },
  Parcel: {
    levyCalculations: (parcel) => {
      return calculations.filter(calc => calc.parcelId === parcel.id);
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
    listen: { port: 4003 },
  });
  console.log(`🚀 Levy Calculator subgraph ready at ${url}`);
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export { server, startServer };