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
        WHERE id = $1 OR prop_id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Parcel not found' });
      }
      
      res.json(result.rows[0]);
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
    const unit = areaUnitSchema.parse(req.query.unit);
    
    const client = await pool.connect();
    try {
      // First get the parcel to ensure it exists
      const parcelResult = await client.query(`
        SELECT prop_id as parcel_id, geom
        FROM Property_val
        WHERE id = $1 OR prop_id = $1
      `, [id]);
      
      if (parcelResult.rows.length === 0) {
        return res.status(404).json({ error: 'Parcel not found' });
      }
      
      // Calculate area based on the unit requested
      const areaQuery = `
        SELECT 
          prop_id as parcel_id,
          CASE 
            WHEN $2 = 'SQUARE_METERS' THEN ST_Area(geom::geography)
            WHEN $2 = 'SQUARE_FEET' THEN ST_Area(geom::geography) * 10.7639
            WHEN $2 = 'ACRES' THEN ST_Area(geom::geography) * 0.000247105
            WHEN $2 = 'HECTARES' THEN ST_Area(geom::geography) * 0.0001
            ELSE ST_Area(geom::geography)
          END as area,
          $2 as unit
        FROM Property_val
        WHERE id = $1 OR prop_id = $1
      `;
      
      const areaResult = await client.query(areaQuery, [id, unit]);
      res.json(areaResult.rows[0]);
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
      
      // Update the geometry
      const updateResult = await client.query(`
        UPDATE Property_val
        SET 
          geom = ST_SetSRID(ST_GeomFromGeoJSON($1), 4326),
          centroid = ST_Centroid(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 OR prop_id = $2
        RETURNING id, prop_id as parcel_id, ST_AsGeoJSON(geom)::json as geom, ST_AsGeoJSON(centroid)::json as centroid
      `, [JSON.stringify(geometry), id]);
      
      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Parcel not found' });
      }
      
      // Get the updated parcel
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
        WHERE id = $1 OR prop_id = $1
      `, [id]);
      
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