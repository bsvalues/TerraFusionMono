import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { gql } from 'graphql-tag';

// Define the schema for this subgraph
const typeDefs = gql`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable"])

  type Query {
    serviceInfo: ServiceInfo
    parcels: [Parcel]
    parcel(id: ID!): Parcel
  }

  type ServiceInfo @shareable {
    name: String
    version: String
    status: String
  }

  type Parcel @key(fields: "id") {
    id: ID!
    name: String
    externalId: String
    area: Float
    centroid: Point
    boundingBox: BoundingBox
    createdAt: String
    updatedAt: String
  }

  type Point {
    lat: Float
    lng: Float
  }

  type BoundingBox {
    minLat: Float
    minLng: Float
    maxLat: Float
    maxLng: Float
  }
`;

// Sample data
const parcels = [
  {
    id: '1',
    name: 'North Field',
    externalId: 'NF-123',
    area: 150.5,
    centroid: { lat: 37.7749, lng: -122.4194 },
    boundingBox: { minLat: 37.7, minLng: -122.5, maxLat: 37.8, maxLng: -122.3 },
    createdAt: '2025-01-15T12:00:00Z',
    updatedAt: '2025-04-10T14:30:00Z',
  },
  {
    id: '2',
    name: 'South Pasture',
    externalId: 'SP-456',
    area: 200.75,
    centroid: { lat: 34.0522, lng: -118.2437 },
    boundingBox: { minLat: 34.0, minLng: -118.3, maxLat: 34.1, maxLng: -118.1 },
    createdAt: '2025-02-20T09:15:00Z',
    updatedAt: '2025-04-15T10:45:00Z',
  },
];

// Define resolvers
const resolvers = {
  Query: {
    serviceInfo: () => ({ name: 'GIS Hub Service', version: '1.0.0', status: 'healthy' }),
    parcels: () => parcels,
    parcel: (_, { id }) => parcels.find(parcel => parcel.id === id),
  },
  Parcel: {
    __resolveReference: (reference) => {
      return parcels.find(parcel => parcel.id === reference.id);
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
    listen: { port: 4002 },
  });
  console.log(`🚀 GIS Hub subgraph ready at ${url}`);
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export { server, startServer };