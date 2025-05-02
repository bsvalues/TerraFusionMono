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

export default router;