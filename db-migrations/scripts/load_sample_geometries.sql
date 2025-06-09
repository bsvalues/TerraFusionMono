-- Load Sample Parcel Geometries
-- This script creates and populates sample parcel geometries
-- for testing GIS functionality in TerraFusion

-- Create a temporary table to hold sample parcel geometries
CREATE TABLE IF NOT EXISTS property_val_geom_tmp (
  prop_id VARCHAR(40) PRIMARY KEY,
  geom GEOMETRY(POLYGON, 4326)
);

-- Insert sample NYC area parcels (simplified geometries for testing)
-- These are representative parcel shapes, not actual property boundaries
INSERT INTO property_val_geom_tmp (prop_id, geom) VALUES
('NYC001', ST_GeomFromText('POLYGON((-73.99 40.73, -73.985 40.73, -73.985 40.735, -73.99 40.735, -73.99 40.73))', 4326)),
('NYC002', ST_GeomFromText('POLYGON((-73.985 40.73, -73.98 40.73, -73.98 40.735, -73.985 40.735, -73.985 40.73))', 4326)),
('NYC003', ST_GeomFromText('POLYGON((-73.99 40.735, -73.985 40.735, -73.985 40.74, -73.99 40.74, -73.99 40.735))', 4326)),
('NYC004', ST_GeomFromText('POLYGON((-73.985 40.735, -73.98 40.735, -73.98 40.74, -73.985 40.74, -73.985 40.735))', 4326)),
('NYC005', ST_GeomFromText('POLYGON((-73.98 40.73, -73.975 40.73, -73.975 40.735, -73.98 40.735, -73.98 40.73))', 4326)),
('NYC006', ST_GeomFromText('POLYGON((-73.98 40.735, -73.975 40.735, -73.975 40.74, -73.98 40.74, -73.98 40.735))', 4326)),
('NYC007', ST_GeomFromText('POLYGON((-73.975 40.73, -73.97 40.73, -73.97 40.735, -73.975 40.735, -73.975 40.73))', 4326)),
('NYC008', ST_GeomFromText('POLYGON((-73.975 40.735, -73.97 40.735, -73.97 40.74, -73.975 40.74, -73.975 40.735))', 4326));

-- Add some SF area parcels for diversity
INSERT INTO property_val_geom_tmp (prop_id, geom) VALUES
('SF001', ST_GeomFromText('POLYGON((-122.42 37.775, -122.415 37.775, -122.415 37.78, -122.42 37.78, -122.42 37.775))', 4326)),
('SF002', ST_GeomFromText('POLYGON((-122.415 37.775, -122.41 37.775, -122.41 37.78, -122.415 37.78, -122.415 37.775))', 4326)),
('SF003', ST_GeomFromText('POLYGON((-122.42 37.78, -122.415 37.78, -122.415 37.785, -122.42 37.785, -122.42 37.78))', 4326)),
('SF004', ST_GeomFromText('POLYGON((-122.415 37.78, -122.41 37.78, -122.41 37.785, -122.415 37.785, -122.415 37.78))', 4326));

-- Add some Chicago area parcels
INSERT INTO property_val_geom_tmp (prop_id, geom) VALUES
('CHI001', ST_GeomFromText('POLYGON((-87.64 41.88, -87.635 41.88, -87.635 41.885, -87.64 41.885, -87.64 41.88))', 4326)),
('CHI002', ST_GeomFromText('POLYGON((-87.635 41.88, -87.63 41.88, -87.63 41.885, -87.635 41.885, -87.635 41.88))', 4326)),
('CHI003', ST_GeomFromText('POLYGON((-87.64 41.885, -87.635 41.885, -87.635 41.89, -87.64 41.89, -87.64 41.885))', 4326)),
('CHI004', ST_GeomFromText('POLYGON((-87.635 41.885, -87.63 41.885, -87.63 41.89, -87.635 41.89, -87.635 41.885))', 4326));

-- Create property and parcel tables if they don't exist (for testing purposes)
-- In a real scenario, these would already exist from your schema migrations
CREATE TABLE IF NOT EXISTS Property_val (
  id SERIAL PRIMARY KEY,
  prop_id VARCHAR(40) UNIQUE,
  address VARCHAR(255),
  owner_name VARCHAR(255),
  county VARCHAR(100),
  state_code CHAR(2),
  geom GEOMETRY(GEOMETRY, 4326),
  centroid GEOMETRY(POINT, 4326),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add sample property data that matches our geometries
INSERT INTO Property_val (prop_id, address, owner_name, county, state_code)
VALUES 
('NYC001', '123 Broadway, New York, NY 10007', 'John Smith', 'New York', 'NY'),
('NYC002', '456 Broadway, New York, NY 10007', 'Jane Doe', 'New York', 'NY'),
('NYC003', '789 5th Avenue, New York, NY 10022', 'Robert Johnson', 'New York', 'NY'),
('NYC004', '101 Park Avenue, New York, NY 10178', 'Emily Williams', 'New York', 'NY'),
('NYC005', '222 East 42nd Street, New York, NY 10017', 'Michael Brown', 'New York', 'NY'),
('NYC006', '350 5th Avenue, New York, NY 10118', 'Sarah Davis', 'New York', 'NY'),
('NYC007', '30 Rockefeller Plaza, New York, NY 10112', 'David Miller', 'New York', 'NY'),
('NYC008', '1 World Trade Center, New York, NY 10007', 'Laura Wilson', 'New York', 'NY'),
('SF001', '101 Market Street, San Francisco, CA 94105', 'Thomas Moore', 'San Francisco', 'CA'),
('SF002', '900 North Point Street, San Francisco, CA 94109', 'Jessica Taylor', 'San Francisco', 'CA'),
('SF003', '24 Willie Mays Plaza, San Francisco, CA 94107', 'Daniel Anderson', 'San Francisco', 'CA'),
('SF004', '1 Ferry Building, San Francisco, CA 94111', 'Lisa Martinez', 'San Francisco', 'CA'),
('CHI001', '233 S Wacker Dr, Chicago, IL 60606', 'James Thompson', 'Cook', 'IL'),
('CHI002', '875 N Michigan Ave, Chicago, IL 60611', 'Patricia Jackson', 'Cook', 'IL'),
('CHI003', '111 S Michigan Ave, Chicago, IL 60603', 'Andrew Harris', 'Cook', 'IL'),
('CHI004', '1060 W Addison St, Chicago, IL 60613', 'Jennifer White', 'Cook', 'IL')
ON CONFLICT (prop_id) DO UPDATE SET 
  address = EXCLUDED.address, 
  owner_name = EXCLUDED.owner_name,
  county = EXCLUDED.county,
  state_code = EXCLUDED.state_code;

-- Update property_val with geometries and calculate centroids
UPDATE Property_val p
SET 
  geom = g.geom,
  centroid = ST_Centroid(g.geom)
FROM property_val_geom_tmp g
WHERE p.prop_id = g.prop_id;

-- Create a view that returns property data with GeoJSON
CREATE OR REPLACE VIEW property_val_geojson AS
SELECT 
  id, 
  prop_id, 
  address, 
  owner_name, 
  county, 
  state_code,
  ST_AsGeoJSON(geom)::json as geom_json,
  ST_AsGeoJSON(centroid)::json as centroid_json,
  created_at,
  updated_at
FROM Property_val
WHERE geom IS NOT NULL;

-- Verify spatial data
SELECT 'Parcel count with geometry: ' || COUNT(*) as info FROM Property_val WHERE geom IS NOT NULL;

-- Verify spatial index usage with EXPLAIN
EXPLAIN 
SELECT prop_id, address 
FROM Property_val 
WHERE geom && ST_MakeEnvelope(-74, 40.7, -73.9, 40.8, 4326);

-- Drop the temporary table
DROP TABLE property_val_geom_tmp;

-- Show sample for verification
SELECT prop_id, address, ST_AsText(centroid) as centroid_point
FROM Property_val
LIMIT 5;