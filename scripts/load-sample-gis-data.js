/**
 * Sample GIS Data Loader Script
 * 
 * This script loads sample parcel data into the database for testing GIS operations.
 * The sample parcels have predictable geometries for testing the spatial analysis endpoints.
 */

import pg from 'pg';

// Get DB connection string from environment variable
const connectionString = process.env.DATABASE_URL;

// Create a simple polygon with a hole (donut shape)
function createPolygonWithHole(centerLat, centerLon, outerRadius, innerRadius) {
  const numPoints = 20; // Number of points in each ring
  const outerRing = [];
  const innerRing = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    
    // Outer ring
    outerRing.push([
      centerLon + outerRadius * Math.cos(angle),
      centerLat + outerRadius * Math.sin(angle)
    ]);
    
    // Inner ring (hole)
    innerRing.push([
      centerLon + innerRadius * Math.cos(angle),
      centerLat + innerRadius * Math.sin(angle)
    ]);
  }
  
  return {
    type: 'Polygon',
    coordinates: [outerRing, innerRing.reverse()] // Note: inner rings must be in reverse order
  };
}

// Create a simple polygon
function createPolygon(centerLat, centerLon, radius, numPoints = 5) {
  const ring = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    ring.push([
      centerLon + radius * Math.cos(angle),
      centerLat + radius * Math.sin(angle)
    ]);
  }
  
  // Close the ring
  ring.push(ring[0]);
  
  return {
    type: 'Polygon',
    coordinates: [ring]
  };
}

async function loadSampleData() {
  const client = new pg.Client({
    connectionString,
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // First check if the table exists
    const checkTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'property_val'
      );
    `);
    
    if (!checkTableResult.rows[0].exists) {
      console.log('Creating Property_val table...');
      
      // Create table with PostGIS geometry column
      await client.query(`
        CREATE TABLE IF NOT EXISTS Property_val (
          id SERIAL PRIMARY KEY,
          prop_id VARCHAR(20) UNIQUE NOT NULL,
          address VARCHAR(255),
          owner_name VARCHAR(100),
          geom GEOMETRY(Geometry, 4326)
        );
      `);
      
      // Create spatial index
      await client.query(`
        CREATE INDEX IF NOT EXISTS property_geom_idx ON Property_val USING GIST(geom);
      `);
    }
    
    // Clear existing sample data
    await client.query(`DELETE FROM Property_val WHERE prop_id LIKE 'SAMPLE-%';`);
    console.log('Cleared existing sample data');
    
    // Create sample parcels
    const sampleParcels = [
      {
        prop_id: 'SAMPLE-0001',
        address: '123 Main St, Sample City',
        owner_name: 'John Doe',
        geom: createPolygon(34.05, -118.25, 0.01)
      },
      {
        prop_id: 'SAMPLE-0002',
        address: '456 Oak Ave, Sample City',
        owner_name: 'Jane Smith',
        geom: createPolygon(34.055, -118.26, 0.01)
      },
      {
        prop_id: 'SAMPLE-0003',
        address: '789 Pine Blvd, Sample City',
        owner_name: 'Bob Johnson',
        geom: createPolygon(34.06, -118.25, 0.01)
      },
      {
        prop_id: 'SAMPLE-0004',
        address: '321 Elm St, Sample City',
        owner_name: 'Alice Brown',
        geom: createPolygonWithHole(34.05, -118.24, 0.015, 0.005)
      },
      {
        prop_id: 'SAMPLE-0005',
        address: '654 Birch Ln, Sample City',
        owner_name: 'Charlie Wilson',
        // Create parcel that touches SAMPLE-0001
        geom: createPolygon(34.06, -118.25, 0.01)
      }
    ];
    
    // Insert sample parcels
    for (const parcel of sampleParcels) {
      await client.query(`
        INSERT INTO Property_val (prop_id, address, owner_name, geom)
        VALUES ($1, $2, $3, ST_GeomFromGeoJSON($4))
      `, [
        parcel.prop_id,
        parcel.address,
        parcel.owner_name,
        JSON.stringify(parcel.geom)
      ]);
    }
    
    console.log(`Inserted ${sampleParcels.length} sample parcels`);
    
    // Create adjacent parcels for boundary testing
    const adjacentParcel = {
      prop_id: 'SAMPLE-ADJ1',
      address: '111 Adjacent St, Sample City',
      owner_name: 'Adjacent Owner',
      // This will be adjacent to SAMPLE-0001
      geom: {
        type: 'Polygon',
        coordinates: [[
          [-118.24, 34.05],
          [-118.24, 34.06],
          [-118.23, 34.06],
          [-118.23, 34.05],
          [-118.24, 34.05]
        ]]
      }
    };
    
    await client.query(`
      INSERT INTO Property_val (prop_id, address, owner_name, geom)
      VALUES ($1, $2, $3, ST_GeomFromGeoJSON($4))
    `, [
      adjacentParcel.prop_id,
      adjacentParcel.address,
      adjacentParcel.owner_name,
      JSON.stringify(adjacentParcel.geom)
    ]);
    
    console.log('Inserted adjacent parcel for boundary testing');
    
    // Add an overlapping parcel for intersection testing
    const overlappingParcel = {
      prop_id: 'SAMPLE-OVER1',
      address: '222 Overlap Ave, Sample City',
      owner_name: 'Overlap Owner',
      // This will overlap with SAMPLE-0001
      geom: {
        type: 'Polygon',
        coordinates: [[
          [-118.26, 34.04],
          [-118.26, 34.06],
          [-118.24, 34.06],
          [-118.24, 34.04],
          [-118.26, 34.04]
        ]]
      }
    };
    
    await client.query(`
      INSERT INTO Property_val (prop_id, address, owner_name, geom)
      VALUES ($1, $2, $3, ST_GeomFromGeoJSON($4))
    `, [
      overlappingParcel.prop_id,
      overlappingParcel.address,
      overlappingParcel.owner_name,
      JSON.stringify(overlappingParcel.geom)
    ]);
    
    console.log('Inserted overlapping parcel for intersection testing');
    
    // Verify sample data
    const countResult = await client.query(`
      SELECT COUNT(*) FROM Property_val WHERE prop_id LIKE 'SAMPLE-%';
    `);
    
    console.log(`Verification: ${countResult.rows[0].count} sample parcels in database`);
    
    console.log('Sample GIS data loaded successfully');
  } catch (error) {
    console.error('Error loading sample data:', error);
  } finally {
    await client.end();
  }
}

// Run the data loader
loadSampleData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});