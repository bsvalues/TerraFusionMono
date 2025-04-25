import { gql } from 'apollo-server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { resolvers } from './resolvers';

// Define the subgraph schema
const typeDefs = gql`
  # Extend the base schema to participate in federation
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable"])

  # Define types for crop identification

  type CropIdentification @key(fields: "id") {
    id: ID!
    userId: Int!
    parcelId: String
    cropName: String!
    scientificName: String
    confidence: Float!
    estimatedGrowthStage: String
    details: String
    characteristics: [String!]
    possibleAlternatives: [String!]
    imageUrl: String
    thumbnailUrl: String
    timestamp: String!
    verified: Boolean
    feedback: String
  }

  type CropIdentificationResult {
    success: Boolean!
    identification: CropIdentification
    message: String
  }

  type IdentificationHistory {
    userId: Int!
    totalIdentifications: Int!
    recentIdentifications: [CropIdentification!]!
    frequentCrops: [CropFrequency!]!
    identificationsByMonth: [MonthlyCount!]!
  }

  type CropFrequency {
    cropName: String!
    count: Int!
    percentage: Float!
  }

  type MonthlyCount {
    month: String!
    year: Int!
    count: Int!
  }

  type CropDatabase {
    cropTypes: [CropType!]!
    count: Int!
  }

  type CropType {
    name: String!
    scientificName: String!
    family: String!
    growingRegions: [String!]!
    growthStages: [GrowthStage!]!
    typicalCharacteristics: [String!]!
    commonVarieties: [String!]!
    imageUrl: String
  }

  type GrowthStage {
    name: String!
    description: String!
    typicalDuration: String!
    visualIndicators: [String!]!
  }

  # Define query operations
  type Query {
    # Crop Identification Queries
    cropIdentification(id: ID!): CropIdentification
    cropIdentifications(userId: Int!, limit: Int, parcelId: String): [CropIdentification!]!
    cropIdentificationHistory(userId: Int!): IdentificationHistory
    
    # Crop Database Queries
    cropDatabase(filter: String): CropDatabase
    cropType(name: String!): CropType
  }

  # Define mutation operations
  type Mutation {
    # Crop Identification Mutations
    identifyCrop(
      userId: Int!,
      parcelId: String,
      imageBase64: String!
    ): CropIdentificationResult
    
    # Feedback Mutations
    verifyCropIdentification(
      id: ID!,
      userId: Int!,
      verified: Boolean!,
      feedback: String
    ): CropIdentification
  }
`;

// Create and export the subgraph schema
export const schema = buildSubgraphSchema({
  typeDefs,
  resolvers,
});