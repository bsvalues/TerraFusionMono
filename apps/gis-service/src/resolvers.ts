import { eq, sql } from 'drizzle-orm';
import { db, spatialQueries, testPostGIS } from './db';
import { Pool } from 'pg';
import { parcels } from '../../../shared/schema';
import { Logger } from './utils/logger';

// Access the pool from db.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const logger = new Logger('GisResolvers');

// GraphQL resolvers for the GIS service
export const resolvers = {
  // Custom scalar types
  GeoJSON: {
    serialize: (value: any) => value,
    parseValue: (value: any) => value,
    parseLiteral: (ast: any) => {
      if (ast.kind === 'StringValue') {
        return JSON.parse(ast.value);
      }
      return ast.value;
    }
  },
  
  WKT: {
    serialize: (value: string) => value,
    parseValue: (value: string) => value,
    parseLiteral: (ast: any) => {
      if (ast.kind === 'StringValue') {
        return ast.value;
      }
      return null;
    }
  },
  
  // Top-level queries
  Query: {
    // Service information
    serviceInfo: async () => {
      const postgisVersion = await testPostGIS();
      return {
        name: 'TerraFusion GIS Service',
        version: '1.0.0',
        status: 'active',
        postgisVersion
      };
    },
    
    // Fetch all parcels
    parcels: async () => {
      try {
        const parcelsList = await db.select().from(parcels);
        return parcelsList.map(parcel => ({
          ...parcel,
          centerPoint: {
            lat: parseFloat(parcel.centerLat?.toString() || '0'),
            lng: parseFloat(parcel.centerLng?.toString() || '0')
          }
        }));
      } catch (error) {
        logger.error(`Error fetching parcels: ${error}`);
        return [];
      }
    },
    
    // Fetch a single parcel by ID
    parcel: async (_: any, { id }: { id: string }) => {
      try {
        const parcelId = parseInt(id);
        const [parcel] = await db.select().from(parcels).where(eq(parcels.id, parcelId));
        
        if (!parcel) {
          return null;
        }
        
        return {
          ...parcel,
          centerPoint: {
            lat: parseFloat(parcel.centerLat?.toString() || '0'),
            lng: parseFloat(parcel.centerLng?.toString() || '0')
          }
        };
      } catch (error) {
        logger.error(`Error fetching parcel by ID: ${error}`);
        return null;
      }
    },
    
    // Fetch a single parcel by external ID
    parcelByExternalId: async (_: any, { externalId }: { externalId: string }) => {
      try {
        const [parcel] = await db.select().from(parcels).where(eq(parcels.externalId, externalId));
        
        if (!parcel) {
          return null;
        }
        
        return {
          ...parcel,
          centerPoint: {
            lat: parseFloat(parcel.centerLat?.toString() || '0'),
            lng: parseFloat(parcel.centerLng?.toString() || '0')
          }
        };
      } catch (error) {
        logger.error(`Error fetching parcel by external ID: ${error}`);
        return null;
      }
    },
    
    // Access spatial queries
    spatial: () => ({}),
    
    // Convert point to WKT
    pointToWkt: async (_: any, { lat, lng }: { lat: number, lng: number }) => {
      try {
        const result = await db.execute<{ wkt: string }>(
          sql`SELECT ST_AsText(ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)) as wkt`
        );
        return result[0]?.wkt || null;
      } catch (error) {
        logger.error(`Error converting point to WKT: ${error}`);
        return null;
      }
    },
    
    // Convert WKT to GeoJSON
    wktToGeoJSON: async (_: any, { wkt }: { wkt: string }) => {
      return await spatialQueries.wktToGeoJSON(wkt);
    },
    
    // Convert GeoJSON to WKT
    geoJSONToWkt: async (_: any, { geoJSON }: { geoJSON: any }) => {
      return await spatialQueries.geoJSONToWkt(geoJSON);
    }
  },
  
  // Spatial queries
  SpatialQuery: {
    // Find parcels within a distance of a geometry
    within: async (_: any, { geometryWkt, distance }: { geometryWkt: string, distance?: number }) => {
      try {
        // If distance is provided, use ST_DWithin, otherwise use ST_Within
        let result;
        if (distance) {
          result = await pool.query(`
            SELECT p.*, ST_AsText(geom) as geom_wkt
            FROM parcels p
            WHERE ST_DWithin(
              geom::geography, 
              ST_GeomFromText($1, 4326)::geography,
              $2
            )
          `, [geometryWkt, distance]);
        } else {
          result = await pool.query(`
            SELECT p.*, ST_AsText(geom) as geom_wkt
            FROM parcels p
            WHERE ST_Within(
              geom, 
              ST_GeomFromText($1, 4326)
            )
          `, [geometryWkt]);
        }
        
        return result.map((parcel: any) => ({
          ...parcel,
          geom: parcel.geom_wkt,
          centerPoint: {
            lat: parseFloat(parcel.center_lat || '0'),
            lng: parseFloat(parcel.center_lng || '0')
          }
        }));
      } catch (error) {
        logger.error(`Error finding parcels within geometry: ${error}`);
        return [];
      }
    },
    
    // Find parcels that intersect with a geometry
    intersects: async (_: any, { geometryWkt }: { geometryWkt: string }) => {
      const parcels = await spatialQueries.findParcelsIntersecting(geometryWkt);
      
      return parcels.map(parcel => ({
        ...parcel,
        geom: parcel.geom_wkt,
        centerPoint: {
          lat: parseFloat(parcel.center_lat || '0'),
          lng: parseFloat(parcel.center_lng || '0')
        }
      }));
    },
    
    // Find parcels near a point
    nearby: async (_: any, { lat, lng, radiusMeters }: { lat: number, lng: number, radiusMeters: number }) => {
      const parcels = await spatialQueries.findParcelsNearPoint(lat, lng, radiusMeters);
      
      return parcels.map(parcel => ({
        ...parcel,
        geom: parcel.geom_wkt,
        centerPoint: {
          lat: parseFloat(parcel.center_lat || '0'),
          lng: parseFloat(parcel.center_lng || '0')
        }
      }));
    },
    
    // Find parcels within a bounding box
    bbox: async (_: any, { minLat, minLng, maxLat, maxLng }: { minLat: number, minLng: number, maxLat: number, maxLng: number }) => {
      const parcels = await spatialQueries.findParcelsInBbox(minLat, minLng, maxLat, maxLng);
      
      return parcels.map(parcel => ({
        ...parcel,
        geom: parcel.geom_wkt,
        centerPoint: {
          lat: parseFloat(parcel.center_lat || '0'),
          lng: parseFloat(parcel.center_lng || '0')
        }
      }));
    }
  },
  
  // Parcel type with spatial functions
  Parcel: {
    // __resolveReference resolver for Federation
    __resolveReference: async (ref: { id: string }) => {
      try {
        const parcelId = parseInt(ref.id);
        const [parcel] = await db.select().from(parcels).where(eq(parcels.id, parcelId));
        
        if (!parcel) {
          return null;
        }
        
        return {
          ...parcel,
          centerPoint: {
            lat: parseFloat(parcel.centerLat?.toString() || '0'),
            lng: parseFloat(parcel.centerLng?.toString() || '0')
          }
        };
      } catch (error) {
        logger.error(`Error resolving parcel reference: ${error}`);
        return null;
      }
    },
    
    // Spatial functions
    containsPoint: async (parcel: any, { lat, lng }: { lat: number, lng: number }) => {
      return await spatialQueries.isPointInParcel(parcel.id, lat, lng);
    },
    
    distance: async (parcel: any, { lat, lng }: { lat: number, lng: number }) => {
      return await spatialQueries.distanceToParcel(parcel.id, lat, lng);
    },
    
    perimeter: async (parcel: any) => {
      return await spatialQueries.calculatePerimeter(parcel.id);
    },
    
    buffer: async (parcel: any, { distance }: { distance: number }) => {
      return await spatialQueries.generateBuffer(parcel.id, distance);
    }
  }
};