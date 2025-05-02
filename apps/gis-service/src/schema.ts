import { gql } from 'graphql-tag';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from './resolvers';

// Define the GraphQL schema for the GIS service
const typeDefs = gql`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@shareable"])

  scalar GeoJSON
  scalar WKT
  
  # Geometry types
  type Point {
    lat: Float!
    lng: Float!
    altitude: Float
  }

  type BoundingBox {
    minLat: Float!
    minLng: Float!
    maxLat: Float!
    maxLng: Float!
  }

  # Spatial functions
  type SpatialQuery {
    within(geometryWkt: WKT!, distance: Float): [Parcel]
    intersects(geometryWkt: WKT!): [Parcel]
    nearby(lat: Float!, lng: Float!, radiusMeters: Float!): [Parcel]
    bbox(minLat: Float!, minLng: Float!, maxLat: Float!, maxLng: Float!): [Parcel]
  }

  # Parcel extended with spatial functions
  type Parcel @key(fields: "id") {
    id: ID!
    externalId: String!
    name: String!
    description: String
    
    # Geospatial data
    boundary: GeoJSON
    centerPoint: Point
    areaHectares: Float
    geom: WKT
    
    # Spatial analysis
    containsPoint(lat: Float!, lng: Float!): Boolean
    distance(lat: Float!, lng: Float!): Float
    perimeter: Float
    buffer(distance: Float!): GeoJSON
  }

  # Service information
  type ServiceInfo @shareable {
    name: String
    version: String
    status: String
    postgisVersion: String
  }

  # Queries
  type Query {
    serviceInfo: ServiceInfo
    parcels: [Parcel]
    parcel(id: ID!): Parcel
    parcelByExternalId(externalId: String!): Parcel
    
    # Spatial queries
    spatial: SpatialQuery
    
    # Basic spatial operations
    pointToWkt(lat: Float!, lng: Float!): WKT
    wktToGeoJSON(wkt: WKT!): GeoJSON
    geoJSONToWkt(geoJSON: GeoJSON!): WKT
  }
`;

// Create and export the executable schema
export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});