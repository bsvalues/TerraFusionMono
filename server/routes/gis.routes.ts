import { Router } from 'express';
import { pool } from '../db';
import { z } from 'zod';

const router = Router();

// Validate bounding box parameters
const bboxSchema = z.object({
  west: z.coerce.number(),
  south: z.coerce.number(),
  east: z.coerce.number(),
  north: z.coerce.number(),
});

// Validate near point parameters
const nearPointSchema = z.object({
  lat: z.coerce.number(),
  lon: z.coerce.number(),
  radius: z.coerce.number().optional().default(1000),
});

// Validate area unit parameter
const areaUnitSchema = z.enum(['SQUARE_METERS', 'SQUARE_FEET', 'ACRES', 'HECTARES']).optional().default('SQUARE_METERS');

// Validate buffer parameters
const bufferSchema = z.object({
  distance: z.coerce.number().positive(),
  unit: z.enum(['METERS', 'FEET', 'MILES', 'KILOMETERS']).optional().default('METERS'),
});

// Validate distance calculation parameters
const distanceSchema = z.object({
  lat: z.coerce.number(),
  lon: z.coerce.number(),
  unit: z.enum(['METERS', 'FEET', 'MILES', 'KILOMETERS']).optional().default('METERS'),
});

// Validate nearest neighbors parameters
const nearestSchema = z.object({
  limit: z.coerce.number().int().positive().optional().default(5),
  maxDistance: z.coerce.number().positive().optional(),
  unit: z.enum(['METERS', 'FEET', 'MILES', 'KILOMETERS']).optional().default('METERS'),
});

// Validate spatial relationship parameters
const relationSchema = z.object({
  relation: z.enum(['contains', 'overlaps', 'touches', 'within', 'intersects', 'disjoint']),
});

// Distance unit conversion helpers
const distanceUnitFactors = {
  METERS: 1,
  FEET: 0.3048, // 1 foot = 0.3048 meters
  MILES: 1609.34, // 1 mile = 1609.34 meters
  KILOMETERS: 1000, // 1 km = 1000 meters
};

// Convert distance to meters based on unit
function convertToMeters(distance: number, unit: string): number {
  return distance * distanceUnitFactors[unit as keyof typeof distanceUnitFactors];
}

// Convert distance from meters based on unit
function convertFromMeters(distance: number, unit: string): number {
  return distance / distanceUnitFactors[unit as keyof typeof distanceUnitFactors];
}

// Get parcels within a bounding box
router.get('/parcels/bbox', async (req, res) => {
  try {
    const { west, south, east, north } = bboxSchema.parse(req.query);
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          id, 
          prop_id as parcel_id, 
          address, 
          owner_name, 
          county, 
          state_code,
          ST_AsGeoJSON(geom)::json as geom,
          ST_AsGeoJSON(centroid)::json as centroid,
          created_at,
          updated_at
        FROM Property_val
        WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)
      `, [west, south, east, north]);
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching parcels in bbox:', error);
    res.status(400).json({ error: 'Invalid parameters or database error' });
  }
});

// Get parcels near a point within radius
router.get('/parcels/near', async (req, res) => {
  try {
    const { lat, lon, radius } = nearPointSchema.parse(req.query);
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          id, 
          prop_id as parcel_id, 
          address, 
          owner_name, 
          county, 
          state_code,
          ST_AsGeoJSON(geom)::json as geom,
          ST_AsGeoJSON(centroid)::json as centroid,
          created_at,
          updated_at
        FROM Property_val
        WHERE ST_DWithin(
          geom,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3
        )
      `, [lon, lat, radius]);
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching parcels near point:', error);
    res.status(400).json({ error: 'Invalid parameters or database error' });
  }
});

// Get a specific parcel by ID
router.get('/parcels/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    const client = await pool.connect();
    try {
      // First try with text ID (prop_id)
      const textResult = await client.query(`
        SELECT 
          id, 
          prop_id as parcel_id, 
          address, 
          owner_name, 
          county, 
          state_code,
          ST_AsGeoJSON(geom)::json as geom,
          ST_AsGeoJSON(centroid)::json as centroid,
          created_at,
          updated_at
        FROM Property_val
        WHERE prop_id = $1
      `, [id]);
      
      // If no results, try with numeric ID
      if (textResult.rows.length === 0) {
        // Check if id can be parsed as a number
        const numId = parseInt(id, 10);
        if (!isNaN(numId)) {
          const numericResult = await client.query(`
            SELECT 
              id, 
              prop_id as parcel_id, 
              address, 
              owner_name, 
              county, 
              state_code,
              ST_AsGeoJSON(geom)::json as geom,
              ST_AsGeoJSON(centroid)::json as centroid,
              created_at,
              updated_at
            FROM Property_val
            WHERE id = $1
          `, [numId]);
          
          if (numericResult.rows.length === 0) {
            return res.status(404).json({ error: 'Parcel not found' });
          }
          
          return res.json(numericResult.rows[0]);
        } else {
          return res.status(404).json({ error: 'Parcel not found' });
        }
      }
      
      res.json(textResult.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error fetching parcel ${req.params.id}:`, error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Calculate area of a parcel
router.get('/parcels/:id/area', async (req, res) => {
  try {
    const id = req.params.id;
    const unitValue = areaUnitSchema.parse(req.query.unit);
    
    const client = await pool.connect();
    try {
      // First try with string ID
      let foundParcel = false;
      let parcelId = id;
      let useNumericId = false;
      
      // Check if the parcel exists with the string ID
      const checkParcelQuery = `
        SELECT id FROM Property_val WHERE prop_id = $1
      `;
      const checkResult = await client.query(checkParcelQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        // Try with numeric ID
        const numId = parseInt(id, 10);
        if (!isNaN(numId)) {
          const numericCheckResult = await client.query(`
            SELECT id FROM Property_val WHERE id = $1
          `, [numId]);
          
          if (numericCheckResult.rows.length === 0) {
            return res.status(404).json({ error: 'Parcel not found' });
          }
          
          foundParcel = true;
          useNumericId = true;
          parcelId = String(numId); // Convert back to string for consistency
        } else {
          return res.status(404).json({ error: 'Parcel not found' });
        }
      } else {
        foundParcel = true;
      }
      
      // Calculate area based on the unit requested
      let areaQuery = '';
      
      if (useNumericId) {
        areaQuery = `
          SELECT 
            prop_id as parcel_id,
            ST_Area(geom::geography) as square_meters,
            $2 as unit
          FROM Property_val
          WHERE id = $1::integer
        `;
      } else {
        areaQuery = `
          SELECT 
            prop_id as parcel_id,
            ST_Area(geom::geography) as square_meters,
            $2 as unit
          FROM Property_val
          WHERE prop_id = $1
        `;
      }
      
      const areaResult = await client.query(areaQuery, [parcelId, unitValue]);
      
      if (areaResult.rows.length === 0) {
        return res.status(404).json({ error: 'Parcel not found or area calculation failed' });
      }
      
      // Convert area based on requested unit
      const squareMeters = areaResult.rows[0].square_meters;
      let area = squareMeters;
      
      switch (unitValue) {
        case 'SQUARE_FEET':
          area = squareMeters * 10.7639;
          break;
        case 'ACRES':
          area = squareMeters * 0.000247105;
          break;
        case 'HECTARES':
          area = squareMeters * 0.0001;
          break;
        case 'SQUARE_METERS':
        default:
          // Already in square meters
          break;
      }
      
      const result = {
        parcel_id: areaResult.rows[0].parcel_id,
        area: area,
        unit: unitValue
      };
      
      res.json(result);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error calculating area for parcel ${req.params.id}:`, error);
    res.status(400).json({ error: 'Invalid parameters or database error' });
  }
});

// Update parcel geometry
router.put('/parcels/:id/geometry', async (req, res) => {
  try {
    const id = req.params.id;
    const geometry = req.body.geometry;
    
    if (!geometry) {
      return res.status(400).json({ error: 'Geometry data is required' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Try to find the parcel first by prop_id (text ID)
      const findQuery = `
        SELECT id, prop_id FROM Property_val WHERE prop_id = $1
      `;
      const findResult = await client.query(findQuery, [id]);
      
      let parcelId = id;
      let isNumericId = false;
      
      // If not found by text ID, try numeric ID
      if (findResult.rows.length === 0) {
        const numId = parseInt(id, 10);
        if (!isNaN(numId)) {
          const numericFindResult = await client.query(`
            SELECT id, prop_id FROM Property_val WHERE id = $1
          `, [numId]);
          
          if (numericFindResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Parcel not found' });
          }
          
          parcelId = String(numId); // Convert to string to maintain consistent typing
          isNumericId = true;
        } else {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Parcel not found' });
        }
      }
      
      // Update the geometry
      let updateQuery = '';
      
      if (isNumericId) {
        // For numeric IDs, cast to integer
        updateQuery = `
          UPDATE Property_val
          SET 
            geom = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326),
            centroid = ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $2::integer
          RETURNING id, prop_id as parcel_id, ST_AsGeoJSON(geom)::json as geom, ST_AsGeoJSON(centroid)::json as centroid
        `;
      } else {
        // For string IDs (prop_id)
        updateQuery = `
          UPDATE Property_val
          SET 
            geom = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326),
            centroid = ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)),
            updated_at = CURRENT_TIMESTAMP
          WHERE prop_id = $2
          RETURNING id, prop_id as parcel_id, ST_AsGeoJSON(geom)::json as geom, ST_AsGeoJSON(centroid)::json as centroid
        `;
      }
      
      const updateResult = await client.query(updateQuery, [JSON.stringify(geometry), parcelId]);
      
      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Parcel update failed' });
      }
      
      // Get the updated parcel details
      const finalParcelId = updateResult.rows[0].id;
      const parcelResult = await client.query(`
        SELECT 
          id, 
          prop_id as parcel_id, 
          address, 
          owner_name, 
          county, 
          state_code,
          ST_AsGeoJSON(geom)::json as geom,
          ST_AsGeoJSON(centroid)::json as centroid,
          created_at,
          updated_at
        FROM Property_val
        WHERE id = $1
      `, [finalParcelId]);
      
      await client.query('COMMIT');
      res.json(parcelResult.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error updating geometry for parcel ${req.params.id}:`, error);
    res.status(500).json({ error: 'Database error or invalid geometry data' });
  }
});

// 1. Buffer Analysis - Create a buffer around a parcel
router.get('/parcels/:id/buffer', async (req, res) => {
  try {
    const id = req.params.id;
    const { distance, unit } = bufferSchema.parse(req.query);
    
    // Convert distance to meters for calculation
    const distanceInMeters = convertToMeters(distance, unit);
    
    const client = await pool.connect();
    try {
      // First try with string ID (prop_id)
      let query = `
        SELECT 
          p.prop_id as parcel_id,
          ST_AsGeoJSON(ST_Buffer(p.geom::geography, $2)::geometry)::json as buffer_geom
        FROM Property_val p
        WHERE p.prop_id = $1
      `;
      
      let result = await client.query(query, [id, distanceInMeters]);
      
      // If no results, try with numeric ID
      if (result.rows.length === 0) {
        const numId = parseInt(id, 10);
        if (!isNaN(numId)) {
          result = await client.query(`
            SELECT 
              p.prop_id as parcel_id,
              ST_AsGeoJSON(ST_Buffer(p.geom::geography, $2)::geometry)::json as buffer_geom
            FROM Property_val p
            WHERE p.id = $1
          `, [numId, distanceInMeters]);
          
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Parcel not found' });
          }
        } else {
          return res.status(404).json({ error: 'Parcel not found' });
        }
      }
      
      res.json({
        parcel_id: result.rows[0].parcel_id,
        buffer_distance: distance,
        buffer_unit: unit,
        buffer_geom: result.rows[0].buffer_geom
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error creating buffer for parcel ${req.params.id}:`, error);
    res.status(400).json({ error: 'Invalid parameters or database error' });
  }
});

// 2. Intersection Analysis - Find parcels that intersect with a given parcel
router.get('/parcels/:id/intersects', async (req, res) => {
  try {
    const id = req.params.id;
    
    const client = await pool.connect();
    try {
      // First get the geometry of the source parcel
      let sourceGeomQuery = `
        SELECT geom FROM Property_val WHERE prop_id = $1
      `;
      
      let sourceResult = await client.query(sourceGeomQuery, [id]);
      
      // If no results, try with numeric ID
      if (sourceResult.rows.length === 0) {
        const numId = parseInt(id, 10);
        if (!isNaN(numId)) {
          sourceResult = await client.query(`
            SELECT geom FROM Property_val WHERE id = $1
          `, [numId]);
          
          if (sourceResult.rows.length === 0) {
            return res.status(404).json({ error: 'Source parcel not found' });
          }
        } else {
          return res.status(404).json({ error: 'Source parcel not found' });
        }
      }
      
      // Find all parcels that intersect with the source parcel
      const intersectionQuery = `
        SELECT 
          p.id, 
          p.prop_id as parcel_id, 
          p.address, 
          p.owner_name,
          ST_AsGeoJSON(ST_Intersection(p.geom, $1))::json as intersection_geom,
          ST_Area(ST_Intersection(p.geom, $1)::geography) as intersection_area_m2
        FROM Property_val p
        WHERE ST_Intersects(p.geom, $1)
          AND p.prop_id != $2
          AND p.id != $3::integer
        ORDER BY intersection_area_m2 DESC
      `;
      
      // Try with both string and numeric ID to ensure we exclude the source parcel
      const numId = parseInt(id, 10);
      const intersectingResult = await client.query(
        intersectionQuery, 
        [sourceResult.rows[0].geom, id, isNaN(numId) ? -1 : numId]
      );
      
      res.json({
        source_parcel_id: id,
        intersecting_count: intersectingResult.rows.length,
        intersecting_parcels: intersectingResult.rows
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error finding intersecting parcels for ${req.params.id}:`, error);
    res.status(500).json({ error: 'Database error' });
  }
});

// 3. Convex Hull Generation - Generate a convex hull for a parcel or group of parcels
router.get('/parcels/:id/convexhull', async (req, res) => {
  try {
    const id = req.params.id;
    
    const client = await pool.connect();
    try {
      // First try with string ID (prop_id)
      let query = `
        SELECT 
          p.prop_id as parcel_id,
          ST_AsGeoJSON(ST_ConvexHull(p.geom))::json as convex_hull,
          ST_Area(p.geom::geography) as original_area_m2,
          ST_Area(ST_ConvexHull(p.geom)::geography) as convex_hull_area_m2
        FROM Property_val p
        WHERE p.prop_id = $1
      `;
      
      let result = await client.query(query, [id]);
      
      // If no results, try with numeric ID
      if (result.rows.length === 0) {
        const numId = parseInt(id, 10);
        if (!isNaN(numId)) {
          result = await client.query(`
            SELECT 
              p.prop_id as parcel_id,
              ST_AsGeoJSON(ST_ConvexHull(p.geom))::json as convex_hull,
              ST_Area(p.geom::geography) as original_area_m2,
              ST_Area(ST_ConvexHull(p.geom)::geography) as convex_hull_area_m2
            FROM Property_val p
            WHERE p.id = $1
          `, [numId]);
          
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Parcel not found' });
          }
        } else {
          return res.status(404).json({ error: 'Parcel not found' });
        }
      }
      
      // Calculate convexity ratio (original area / convex hull area)
      const originalArea = parseFloat(result.rows[0].original_area_m2);
      const convexHullArea = parseFloat(result.rows[0].convex_hull_area_m2);
      const convexityRatio = originalArea / convexHullArea;
      
      res.json({
        parcel_id: result.rows[0].parcel_id,
        convex_hull: result.rows[0].convex_hull,
        original_area_m2: originalArea,
        convex_hull_area_m2: convexHullArea,
        convexity_ratio: convexityRatio,
        // Interpretation of the ratio - closer to 1 means more convex
        // (similar to original shape), lower values indicate concavity
        complexity_assessment: convexityRatio > 0.9 ? 'Simple' : 
                              convexityRatio > 0.7 ? 'Moderately Complex' : 
                              'Complex'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error generating convex hull for parcel ${req.params.id}:`, error);
    res.status(500).json({ error: 'Database error' });
  }
});

// 4. Distance Calculation - Compute distance from a parcel to a point
router.get('/parcels/:id/distance', async (req, res) => {
  try {
    const id = req.params.id;
    const { lat, lon, unit } = distanceSchema.parse(req.query);
    
    const client = await pool.connect();
    try {
      // First try with string ID (prop_id)
      let query = `
        SELECT 
          p.prop_id as parcel_id,
          ST_Distance(
            p.geom::geography, 
            ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography
          ) as distance_meters,
          ST_ClosestPoint(
            p.geom, 
            ST_SetSRID(ST_MakePoint($2, $3), 4326)
          ) as closest_point
        FROM Property_val p
        WHERE p.prop_id = $1
      `;
      
      let result = await client.query(query, [id, lon, lat]);
      
      // If no results, try with numeric ID
      if (result.rows.length === 0) {
        const numId = parseInt(id, 10);
        if (!isNaN(numId)) {
          result = await client.query(`
            SELECT 
              p.prop_id as parcel_id,
              ST_Distance(
                p.geom::geography, 
                ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography
              ) as distance_meters,
              ST_ClosestPoint(
                p.geom, 
                ST_SetSRID(ST_MakePoint($2, $3), 4326)
              ) as closest_point
            FROM Property_val p
            WHERE p.id = $1
          `, [numId, lon, lat]);
          
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Parcel not found' });
          }
        } else {
          return res.status(404).json({ error: 'Parcel not found' });
        }
      }
      
      // Convert distance to requested unit
      const distanceMeters = parseFloat(result.rows[0].distance_meters);
      const convertedDistance = convertFromMeters(distanceMeters, unit);
      
      // Get coordinates of closest point
      const closestPointWKB = result.rows[0].closest_point;
      
      // Extract coordinates of closest point
      const closestPointQuery = `
        SELECT 
          ST_X(ST_GeomFromEWKB($1)) as lon, 
          ST_Y(ST_GeomFromEWKB($1)) as lat
      `;
      const pointResult = await client.query(closestPointQuery, [closestPointWKB]);
      
      res.json({
        parcel_id: result.rows[0].parcel_id,
        point: {
          lat: parseFloat(lat),
          lon: parseFloat(lon)
        },
        distance: convertedDistance,
        unit: unit,
        closest_point: {
          lat: parseFloat(pointResult.rows[0].lat),
          lon: parseFloat(pointResult.rows[0].lon)
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error calculating distance for parcel ${req.params.id}:`, error);
    res.status(400).json({ error: 'Invalid parameters or database error' });
  }
});

// 5. Spatial Relationships - Check spatial relationships between parcels
router.get('/parcels/:id/relation/:target_id', async (req, res) => {
  try {
    const sourceId = req.params.id;
    const targetId = req.params.target_id;
    const { relation } = relationSchema.parse(req.query);
    
    const client = await pool.connect();
    try {
      // First get the source and target geometries
      let sourceQuery = `SELECT prop_id, geom FROM Property_val WHERE prop_id = $1 OR id = $1::integer`;
      let targetQuery = `SELECT prop_id, geom FROM Property_val WHERE prop_id = $1 OR id = $1::integer`;
      
      const sourceResult = await client.query(sourceQuery, [sourceId]);
      const targetResult = await client.query(targetQuery, [targetId]);
      
      if (sourceResult.rows.length === 0) {
        return res.status(404).json({ error: 'Source parcel not found' });
      }
      
      if (targetResult.rows.length === 0) {
        return res.status(404).json({ error: 'Target parcel not found' });
      }
      
      // Determine which spatial relation function to use
      let relationFunction;
      switch (relation) {
        case 'contains':
          relationFunction = 'ST_Contains';
          break;
        case 'overlaps':
          relationFunction = 'ST_Overlaps';
          break;
        case 'touches':
          relationFunction = 'ST_Touches';
          break;
        case 'within':
          relationFunction = 'ST_Within';
          break;
        case 'intersects':
          relationFunction = 'ST_Intersects';
          break;
        case 'disjoint':
          relationFunction = 'ST_Disjoint';
          break;
      }
      
      // Check the spatial relationship
      const relationQuery = `
        SELECT ${relationFunction}($1, $2) as result
      `;
      
      const relationResult = await client.query(
        relationQuery, 
        [sourceResult.rows[0].geom, targetResult.rows[0].geom]
      );
      
      // Calculate additional metrics if parcels intersect
      let additionalData = {};
      if (relation === 'intersects' && relationResult.rows[0].result) {
        const metricsQuery = `
          SELECT 
            ST_Area(ST_Intersection($1, $2)::geography) as intersection_area_m2,
            ST_Area($1::geography) as source_area_m2,
            ST_Area($2::geography) as target_area_m2
        `;
        
        const metricsResult = await client.query(
          metricsQuery, 
          [sourceResult.rows[0].geom, targetResult.rows[0].geom]
        );
        
        const intersectionArea = parseFloat(metricsResult.rows[0].intersection_area_m2);
        const sourceArea = parseFloat(metricsResult.rows[0].source_area_m2);
        const targetArea = parseFloat(metricsResult.rows[0].target_area_m2);
        
        additionalData = {
          intersection_area_m2: intersectionArea,
          source_area_m2: sourceArea,
          target_area_m2: targetArea,
          overlap_percent_of_source: (intersectionArea / sourceArea) * 100,
          overlap_percent_of_target: (intersectionArea / targetArea) * 100
        };
      }
      
      res.json({
        source_parcel_id: sourceResult.rows[0].prop_id,
        target_parcel_id: targetResult.rows[0].prop_id,
        relation: relation,
        result: relationResult.rows[0].result,
        ...additionalData
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error checking spatial relation between parcels:`, error);
    res.status(400).json({ error: 'Invalid parameters or database error' });
  }
});

// 6. Topology Validation - Validate topology of a parcel geometry
router.get('/parcels/:id/validate', async (req, res) => {
  try {
    const id = req.params.id;
    
    const client = await pool.connect();
    try {
      // First try with string ID (prop_id)
      let query = `
        SELECT 
          p.prop_id as parcel_id,
          ST_IsValid(p.geom) as is_valid,
          ST_IsValidReason(p.geom) as validation_message,
          ST_IsSimple(p.geom) as is_simple,
          ST_IsClosed(ST_ExteriorRing(p.geom)) as is_closed,
          ST_NPoints(p.geom) as num_points
        FROM Property_val p
        WHERE p.prop_id = $1
      `;
      
      let result = await client.query(query, [id]);
      
      // If no results, try with numeric ID
      if (result.rows.length === 0) {
        const numId = parseInt(id, 10);
        if (!isNaN(numId)) {
          result = await client.query(`
            SELECT 
              p.prop_id as parcel_id,
              ST_IsValid(p.geom) as is_valid,
              ST_IsValidReason(p.geom) as validation_message,
              ST_IsSimple(p.geom) as is_simple,
              ST_IsClosed(ST_ExteriorRing(p.geom)) as is_closed,
              ST_NPoints(p.geom) as num_points
            FROM Property_val p
            WHERE p.id = $1
          `, [numId]);
          
          if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Parcel not found' });
          }
        } else {
          return res.status(404).json({ error: 'Parcel not found' });
        }
      }
      
      // If invalid, try to get a corrected version
      let correctedGeom = null;
      if (!result.rows[0].is_valid) {
        const fixQuery = `
          SELECT ST_AsGeoJSON(ST_MakeValid(geom))::json as fixed_geom
          FROM Property_val
          WHERE prop_id = $1 OR id = $1::integer
        `;
        
        const fixResult = await client.query(fixQuery, [id]);
        if (fixResult.rows.length > 0) {
          correctedGeom = fixResult.rows[0].fixed_geom;
        }
      }
      
      res.json({
        parcel_id: result.rows[0].parcel_id,
        validation: {
          is_valid: result.rows[0].is_valid,
          validation_message: result.rows[0].validation_message,
          is_simple: result.rows[0].is_simple,
          is_closed: result.rows[0].is_closed,
          num_vertices: parseInt(result.rows[0].num_points),
          has_auto_fix: correctedGeom !== null
        },
        corrected_geometry: correctedGeom
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error validating geometry for parcel ${req.params.id}:`, error);
    res.status(500).json({ error: 'Database error' });
  }
});

// 7. Nearest Neighbors Analysis - Find nearest neighboring parcels
router.get('/parcels/:id/nearest', async (req, res) => {
  try {
    const id = req.params.id;
    const { limit, maxDistance, unit } = nearestSchema.parse(req.query);
    
    // Convert maxDistance to meters if provided
    const maxDistanceMeters = maxDistance ? convertToMeters(maxDistance, unit) : null;
    
    const client = await pool.connect();
    try {
      // First get the source parcel's geometry
      let sourceQuery = `
        SELECT id, prop_id, geom FROM Property_val 
        WHERE prop_id = $1 OR id = $1::integer
      `;
      
      const sourceResult = await client.query(sourceQuery, [id]);
      
      if (sourceResult.rows.length === 0) {
        return res.status(404).json({ error: 'Source parcel not found' });
      }
      
      const sourceId = sourceResult.rows[0].id;
      const sourcePropId = sourceResult.rows[0].prop_id;
      
      // Find nearest neighbors with distance
      let nearestQuery = `
        SELECT 
          p.id, 
          p.prop_id as parcel_id, 
          p.address, 
          p.owner_name,
          ST_Distance(p.geom::geography, $1::geography) as distance_meters,
          ST_AsGeoJSON(p.geom)::json as geom
        FROM Property_val p
        WHERE p.id != $2
        ${maxDistanceMeters ? 'AND ST_DWithin(p.geom::geography, $1::geography, $4)' : ''}
        ORDER BY ST_Distance(p.geom::geography, $1::geography)
        LIMIT $3
      `;
      
      const nearestResult = await client.query(
        maxDistanceMeters 
          ? nearestQuery 
          : nearestQuery.replace('${maxDistanceMeters ? \'AND ST_DWithin(p.geom::geography, $1::geography, $4)\' : \'\'}', ''), 
        maxDistanceMeters 
          ? [sourceResult.rows[0].geom, sourceId, limit, maxDistanceMeters] 
          : [sourceResult.rows[0].geom, sourceId, limit]
      );
      
      // Convert distances to requested unit
      const neighbors = nearestResult.rows.map(row => {
        return {
          id: row.id,
          parcel_id: row.parcel_id,
          address: row.address,
          owner_name: row.owner_name,
          distance: convertFromMeters(parseFloat(row.distance_meters), unit),
          distance_unit: unit,
          geom: row.geom
        };
      });
      
      res.json({
        source_parcel_id: sourcePropId,
        nearest_neighbors: neighbors,
        count: neighbors.length,
        max_distance: maxDistance,
        unit: unit
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error finding nearest neighbors for parcel ${req.params.id}:`, error);
    res.status(400).json({ error: 'Invalid parameters or database error' });
  }
});

// 8. Shared Boundary Analysis - Calculate shared boundary length between parcels
router.get('/parcels/:id/boundary/:target_id', async (req, res) => {
  try {
    const sourceId = req.params.id;
    const targetId = req.params.target_id;
    
    const client = await pool.connect();
    try {
      // First get the source and target geometries
      let sourceQuery = `SELECT prop_id, geom FROM Property_val WHERE prop_id = $1 OR id = $1::integer`;
      let targetQuery = `SELECT prop_id, geom FROM Property_val WHERE prop_id = $1 OR id = $1::integer`;
      
      const sourceResult = await client.query(sourceQuery, [sourceId]);
      const targetResult = await client.query(targetQuery, [targetId]);
      
      if (sourceResult.rows.length === 0) {
        return res.status(404).json({ error: 'Source parcel not found' });
      }
      
      if (targetResult.rows.length === 0) {
        return res.status(404).json({ error: 'Target parcel not found' });
      }
      
      // Check if parcels touch
      const touchQuery = `SELECT ST_Touches($1, $2) as touches`;
      const touchResult = await client.query(
        touchQuery, 
        [sourceResult.rows[0].geom, targetResult.rows[0].geom]
      );
      
      if (!touchResult.rows[0].touches) {
        return res.json({
          source_parcel_id: sourceResult.rows[0].prop_id,
          target_parcel_id: targetResult.rows[0].prop_id,
          touches: false,
          shared_boundary_length_m: 0,
          percentage_of_source_boundary: 0,
          percentage_of_target_boundary: 0
        });
      }
      
      // Calculate shared boundary length
      const boundaryQuery = `
        SELECT 
          ST_Length(ST_Intersection(ST_Boundary($1), ST_Boundary($2))::geography) as shared_length_m,
          ST_Length(ST_Boundary($1)::geography) as source_perimeter_m,
          ST_Length(ST_Boundary($2)::geography) as target_perimeter_m
      `;
      
      const boundaryResult = await client.query(
        boundaryQuery, 
        [sourceResult.rows[0].geom, targetResult.rows[0].geom]
      );
      
      const sharedLength = parseFloat(boundaryResult.rows[0].shared_length_m);
      const sourcePerimeter = parseFloat(boundaryResult.rows[0].source_perimeter_m);
      const targetPerimeter = parseFloat(boundaryResult.rows[0].target_perimeter_m);
      
      res.json({
        source_parcel_id: sourceResult.rows[0].prop_id,
        target_parcel_id: targetResult.rows[0].prop_id,
        touches: true,
        shared_boundary_length_m: sharedLength,
        percentage_of_source_boundary: (sharedLength / sourcePerimeter) * 100,
        percentage_of_target_boundary: (sharedLength / targetPerimeter) * 100
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`Error analyzing shared boundary:`, error);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;