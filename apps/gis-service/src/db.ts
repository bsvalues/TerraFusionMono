import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Logger } from './utils/logger';
import * as schema from '../../../shared/schema';

const logger = new Logger('GisDbService');

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize drizzle ORM with the pool
export const db = drizzle(pool, { schema });

// Function to test PostGIS availability
export async function testPostGIS(): Promise<string> {
  try {
    const result = await pool.query('SELECT PostGIS_version()');
    return result.rows[0].postgis_version;
  } catch (error) {
    logger.error(`PostGIS not available: ${error}`);
    return 'PostGIS not available';
  }
}

// Specialized spatial queries that can't be handled by Drizzle ORM
export const spatialQueries = {
  // Find parcels within a specified distance of a point
  async findParcelsNearPoint(lat: number, lng: number, radiusMeters: number): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT p.*, 
          ST_AsText(geom) as geom_wkt,
          ST_Distance(
            geom, 
            ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
          ) as distance_meters
        FROM parcels p
        WHERE ST_DWithin(
          geom, 
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, 
          $3
        )
        ORDER BY distance_meters ASC`,
        [lat, lng, radiusMeters]
      );
      return result.rows;
    } catch (error) {
      logger.error(`Error finding parcels near point: ${error}`);
      return [];
    }
  },

  // Find parcels that intersect with a given WKT geometry
  async findParcelsIntersecting(wkt: string): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT p.*, ST_AsText(geom) as geom_wkt
        FROM parcels p
        WHERE ST_Intersects(
          geom, 
          ST_GeomFromText($1, 4326)
        )`,
        [wkt]
      );
      return result.rows;
    } catch (error) {
      logger.error(`Error finding intersecting parcels: ${error}`);
      return [];
    }
  },

  // Find parcels within a bounding box
  async findParcelsInBbox(minLat: number, minLng: number, maxLat: number, maxLng: number): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT p.*, ST_AsText(geom) as geom_wkt
        FROM parcels p
        WHERE ST_Intersects(
          geom, 
          ST_MakeEnvelope($2, $1, $4, $3, 4326)
        )`,
        [minLat, minLng, maxLat, maxLng]
      );
      return result.rows;
    } catch (error) {
      logger.error(`Error finding parcels in bbox: ${error}`);
      return [];
    }
  },

  // Check if a point is contained within a parcel
  async isPointInParcel(parcelId: number, lat: number, lng: number): Promise<boolean> {
    try {
      const result = await pool.query(
        `SELECT ST_Contains(
          geom, 
          ST_SetSRID(ST_MakePoint($3, $2), 4326)
        ) as contains
        FROM parcels
        WHERE id = $1`,
        [parcelId, lat, lng]
      );
      return result.rows.length > 0 ? result.rows[0].contains : false;
    } catch (error) {
      logger.error(`Error checking if point is in parcel: ${error}`);
      return false;
    }
  },

  // Convert GeoJSON to WKT
  async geoJSONToWkt(geoJSON: any): Promise<string> {
    try {
      const result = await pool.query(
        `SELECT ST_AsText(
          ST_GeomFromGeoJSON($1)
        ) as wkt`,
        [JSON.stringify(geoJSON)]
      );
      return result.rows[0].wkt;
    } catch (error) {
      logger.error(`Error converting GeoJSON to WKT: ${error}`);
      return '';
    }
  },

  // Convert WKT to GeoJSON
  async wktToGeoJSON(wkt: string): Promise<any> {
    try {
      const result = await pool.query(
        `SELECT ST_AsGeoJSON(
          ST_GeomFromText($1, 4326)
        )::json as geojson`,
        [wkt]
      );
      return result.rows[0].geojson;
    } catch (error) {
      logger.error(`Error converting WKT to GeoJSON: ${error}`);
      return null;
    }
  },

  // Calculate the distance between a point and a parcel
  async distanceToParcel(parcelId: number, lat: number, lng: number): Promise<number> {
    try {
      const result = await pool.query(
        `SELECT ST_Distance(
          geom::geography, 
          ST_SetSRID(ST_MakePoint($3, $2), 4326)::geography
        ) as distance_meters
        FROM parcels
        WHERE id = $1`,
        [parcelId, lat, lng]
      );
      return result.rows.length > 0 ? result.rows[0].distance_meters : -1;
    } catch (error) {
      logger.error(`Error calculating distance to parcel: ${error}`);
      return -1;
    }
  },

  // Calculate the perimeter of a parcel
  async calculatePerimeter(parcelId: number): Promise<number> {
    try {
      const result = await pool.query(
        `SELECT ST_Perimeter(geom::geography) as perimeter_meters
        FROM parcels
        WHERE id = $1`,
        [parcelId]
      );
      return result.rows.length > 0 ? result.rows[0].perimeter_meters : -1;
    } catch (error) {
      logger.error(`Error calculating parcel perimeter: ${error}`);
      return -1;
    }
  },

  // Generate a buffer around a parcel's geometry
  async generateBuffer(parcelId: number, distanceMeters: number): Promise<any> {
    try {
      const result = await pool.query(
        `SELECT ST_AsGeoJSON(
          ST_Buffer(geom::geography, $2)::geometry
        )::json as buffer_geojson
        FROM parcels
        WHERE id = $1`,
        [parcelId, distanceMeters]
      );
      return result.rows.length > 0 ? result.rows[0].buffer_geojson : null;
    } catch (error) {
      logger.error(`Error generating buffer around parcel: ${error}`);
      return null;
    }
  }
};