import { gql } from 'apollo-server';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { resolvers } from './resolvers';

// Define the subgraph schema
const typeDefs = gql`
  # Extend the base schema to participate in federation
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable"])

  # Define types for crop health analysis

  type CropHealthAnalysis @key(fields: "id") {
    id: ID!
    parcelId: String!
    timestamp: String!
    cropType: String!
    healthStatus: HealthStatus!
    overallHealth: Int!
    issues: [CropHealthIssue!]!
    spatialDistribution: String
    temporalTrends: String
    growthStage: String
    imageUrl: String
    confidenceScore: Float!
    analyzedBy: String!
  }

  enum HealthStatus {
    EXCELLENT
    GOOD
    MODERATE
    POOR
    CRITICAL
  }

  type CropHealthIssue {
    id: ID!
    name: String!
    description: String!
    severity: Int!
    affectedArea: Float
    detectionConfidence: Float!
    recommendedActions: [String!]!
  }

  type DiseaseDetection @key(fields: "id") {
    id: ID!
    parcelId: String!
    timestamp: String!
    diseaseName: String!
    pathogenType: String!
    severity: Int!
    affectedArea: Float!
    symptoms: [String!]!
    progression: String!
    imageUrl: String
    detectionConfidence: Float!
    recommendedTreatments: [Treatment!]!
    preventiveMeasures: [String!]!
  }

  type Treatment {
    id: ID!
    name: String!
    method: String!
    dosage: String
    frequency: String
    duration: String
    expectedResults: String
    warnings: String
  }

  type SoilAnalysis @key(fields: "id") {
    id: ID!
    parcelId: String!
    timestamp: String!
    ph: Float!
    organicMatter: Float!
    nitrogen: Float!
    phosphorus: Float!
    potassium: Float!
    texture: String!
    drainage: String!
    recommendations: [String!]!
  }

  type YieldPrediction @key(fields: "id") {
    id: ID!
    parcelId: String!
    timestamp: String!
    cropType: String!
    predictedYield: PredictedYield!
    confidenceInterval: ConfidenceInterval!
    confidenceLevel: Float!
    influencingFactors: [InfluencingFactor!]!
    comparisonToAverage: Float!
    harvestDateEstimate: String!
    qualityPrediction: QualityPrediction!
    marketValueEstimate: MarketValueEstimate
  }

  type PredictedYield {
    value: Float!
    unit: String!
    perHectare: Float!
  }

  type ConfidenceInterval {
    low: Float!
    high: Float!
  }

  type InfluencingFactor {
    name: String!
    impact: Float!
    description: String!
  }

  type QualityPrediction {
    overall: String!
    size: String!
    uniformity: Float!
    marketGrade: String!
  }

  type MarketValueEstimate {
    perUnit: Float!
    total: Float!
    currency: String!
  }

  type WeatherData @key(fields: "id") {
    id: ID!
    parcelId: String!
    timestamp: String!
    temperature: Float!
    humidity: Float!
    precipitation: Float!
    windSpeed: Float!
    windDirection: String!
    solarRadiation: Float
    forecast: [WeatherForecast!]!
  }

  type WeatherForecast {
    date: String!
    temperature: Float!
    humidity: Float!
    precipitation: Float!
    description: String!
  }

  # Define query operations
  type Query {
    # Crop Health Analysis Queries
    cropHealthAnalysis(id: ID!): CropHealthAnalysis
    cropHealthAnalysesByParcel(parcelId: String!): [CropHealthAnalysis!]!
    recentCropHealthAnalyses(limit: Int): [CropHealthAnalysis!]!
    
    # Disease Detection Queries
    diseaseDetection(id: ID!): DiseaseDetection
    diseaseDetectionsByParcel(parcelId: String!): [DiseaseDetection!]!
    
    # Soil Analysis Queries
    soilAnalysis(id: ID!): SoilAnalysis
    soilAnalysesByParcel(parcelId: String!): [SoilAnalysis!]!
    
    # Yield Prediction Queries
    yieldPrediction(id: ID!): YieldPrediction
    yieldPredictionsByParcel(parcelId: String!): [YieldPrediction!]!
    
    # Weather Data Queries
    weatherData(id: ID!): WeatherData
    weatherDataByParcel(parcelId: String!): [WeatherData!]!
    weatherForecast(parcelId: String!): [WeatherForecast!]!
  }

  # Define mutation operations
  type Mutation {
    # Crop Health Analysis Mutations
    createCropHealthAnalysis(
      parcelId: String!, 
      cropType: String!, 
      imageBase64: String!
    ): CropHealthAnalysis
    
    # Advanced Analysis
    createAdvancedCropAnalysis(
      parcelId: String!,
      cropType: String!,
      imagesBase64: [String!]!,
      soilType: String,
      weather: String,
      plantingDate: String,
      previousIssues: String
    ): CropHealthAnalysis
    
    # Disease Detection Mutations
    detectDiseases(
      parcelId: String!,
      imageBase64: String!,
      cropType: String!
    ): DiseaseDetection
    
    # Soil Analysis Mutations
    analyzeSoil(
      parcelId: String!,
      sampleImageBase64: String,
      sampleData: SoilSampleInput
    ): SoilAnalysis
    
    # Yield Prediction Mutations
    predictYield(
      parcelId: String!,
      cropType: String!,
      healthStatus: String!,
      environmentalConditions: String,
      historicalYields: String
    ): YieldPrediction
  }

  # Input types
  input SoilSampleInput {
    ph: Float
    organicMatter: Float
    nitrogen: Float
    phosphorus: Float
    potassium: Float
    texture: String
    drainage: String
  }
`;

// Create and export the subgraph schema
export const schema = buildSubgraphSchema({
  typeDefs,
  resolvers,
});