import { GraphQLScalarType } from 'graphql';
import pkg from 'pg';
const { Pool } = pkg;

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Define GeoJSON scalar type
const GeoJSONScalar = new GraphQLScalarType({
  name: 'GeoJSON',
  description: 'GeoJSON scalar type',
  serialize(value) {
    // Convert from string to object if needed
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        console.error('Error parsing GeoJSON:', e);
        return null;
      }
    }
    return value;
  },
  parseValue(value) {
    // Convert to string for database storage if needed
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return value;
  },
  parseLiteral(ast) {
    // Handle literals in queries
    if (ast.kind === 'StringValue') {
      try {
        return JSON.parse(ast.value);
      } catch (e) {
        console.error('Error parsing GeoJSON literal:', e);
        return null;
      }
    }
    return null;
  },
});

// Area unit conversion factors from square meters
const areaConversionFactors = {
  SQUARE_METERS: 1,
  SQUARE_FEET: 10.7639,
  ACRES: 0.000247105,
  HECTARES: 0.0001,
};

// Helper function to validate bounding box
function validateBBox(bbox) {
  if (!Array.isArray(bbox) || bbox.length !== 4) {
    throw new Error('Bounding box must be an array of 4 coordinates [west, south, east, north]');
  }
  
  const [west, south, east, north] = bbox;
  
  if (west > east) {
    throw new Error('West longitude must be less than east longitude');
  }
  
  if (south > north) {
    throw new Error('South latitude must be less than north latitude');
  }
  
  if (west < -180 || east > 180 || south < -90 || north > 90) {
    throw new Error('Coordinates out of bounds');
  }
  
  return [west, south, east, north];
}

// Resolvers
export const resolvers = {
  // Custom scalar type
  GeoJSON: GeoJSONScalar,
  
  Query: {
    // Find parcels within a bounding box
    parcelsInBBox: async (_, { bbox }) => {
      try {
        // Validate and extract bbox coordinates
        const [west, south, east, north] = validateBBox(bbox);
        
        // Create a PostGIS polygon from the bbox
        const query = `
          SELECT 
            id,
            parcel_id,
            address,
            owner_name,
            county,
            state_code,
            boundary_geojson as geom,
            centroid_geojson as centroid,
            created_at,
            updated_at
          FROM 
            parcels
          WHERE 
            boundary_geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
          ORDER BY 
            parcel_id
          LIMIT 100;
        `;
        
        const result = await pool.query(query, [west, south, east, north]);
        return result.rows;
      } catch (error) {
        console.error('Error executing parcelsInBBox query:', error);
        throw error;
      }
    },
    
    // Find parcels near a point within a radius
    parcelsNear: async (_, { lat, lon, radiusMeters }) => {
      try {
        // Validate inputs
        if (lat < -90 || lat > 90) {
          throw new Error('Latitude out of bounds (-90 to 90)');
        }
        
        if (lon < -180 || lon > 180) {
          throw new Error('Longitude out of bounds (-180 to 180)');
        }
        
        if (radiusMeters <= 0) {
          throw new Error('Radius must be positive');
        }
        
        // Execute the spatial query using the GIS helper function
        const query = `
          SELECT * FROM gis.find_parcels_near_point($1, $2, $3)
        `;
        
        const result = await pool.query(query, [lat, lon, radiusMeters]);
        
        // Map the results to the expected format
        return result.rows.map(row => ({
          id: row.id,
          parcel_id: row.parcel_id,
          address: row.address,
          owner_name: row.owner_name,
          geom: row.boundary_geojson,
          centroid: row.centroid_geojson,
        }));
      } catch (error) {
        console.error('Error executing parcelsNear query:', error);
        throw error;
      }
    },
    
    // Get a single parcel by ID
    parcel: async (_, { id }) => {
      try {
        const query = `
          SELECT 
            id,
            parcel_id,
            address,
            owner_name,
            county,
            state_code,
            boundary_geojson as geom,
            centroid_geojson as centroid,
            created_at,
            updated_at
          FROM 
            parcels
          WHERE 
            parcel_id = $1
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
          return null;
        }
        
        return result.rows[0];
      } catch (error) {
        console.error('Error fetching parcel:', error);
        throw error;
      }
    },
    
    // Calculate area of a parcel in various units
    parcelArea: async (_, { id, unit = 'SQUARE_METERS' }) => {
      try {
        // Use the area calculation function
        const query = `
          SELECT 
            $1 as parcel_id,
            gis.calculate_parcel_area($1, $2) as area,
            $2 as unit
        `;
        
        const result = await pool.query(query, [id, unit.toLowerCase()]);
        
        if (result.rows.length === 0) {
          throw new Error(`Parcel with ID ${id} not found`);
        }
        
        return {
          parcel_id: id,
          area: result.rows[0].area,
          unit: unit,
        };
      } catch (error) {
        console.error('Error calculating parcel area:', error);
        throw error;
      }
    },
  },
  
  // Field resolvers for Parcel type
  Parcel: {
    // Calculate area based on the requested unit
    area: async (parent, { unit = 'SQUARE_METERS' }) => {
      try {
        if (!parent.parcel_id) {
          return null;
        }
        
        // Use the PostgreSQL function to calculate the area
        const query = `
          SELECT gis.calculate_parcel_area($1, $2) as area
        `;
        
        const result = await pool.query(query, [parent.parcel_id, unit.toLowerCase()]);
        return result.rows[0].area;
      } catch (error) {
        console.error('Error calculating area:', error);
        return null;
      }
    },
  },
};