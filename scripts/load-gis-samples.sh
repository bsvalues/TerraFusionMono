#!/bin/bash

# Load GIS Sample Data Script
# This script loads sample parcel geometries for testing the GIS functionality

echo "Loading sample parcel geometries for testing..."

# Get the database connection string from environment
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/postgres}"

# For debugging
echo "Using database URL: ${DB_URL}"

# Extract parts from the connection string - handles both formats
if [[ $DB_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
  # Standard format: postgresql://user:pass@host:port/dbname
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASS="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]}"
  DB_NAME="${BASH_REMATCH[5]}"
elif [[ $DB_URL =~ postgres://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
  # Alternate format: postgres://user:pass@host:port/dbname
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASS="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]}"
  DB_NAME="${BASH_REMATCH[5]}"
else
  echo "Error: Could not parse DATABASE_URL format"
  echo "Please manually specify database connection details:"
  
  # Use environment variables if available, or default values
  DB_USER="${PGUSER:-postgres}"
  DB_PASS="${PGPASSWORD:-postgres}"
  DB_HOST="${PGHOST:-localhost}"
  DB_PORT="${PGPORT:-5432}"
  DB_NAME="${PGDATABASE:-postgres}"
  
  echo "Using database connection: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
fi

export PGPASSWORD="$DB_PASS"

# Create a temporary SQL file with sample data
cat > /tmp/sample_parcels.sql << 'EOSQL'
-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create Property_val table if not exists
CREATE TABLE IF NOT EXISTS Property_val (
  id SERIAL PRIMARY KEY,
  prop_id TEXT NOT NULL UNIQUE,
  address TEXT,
  owner_name TEXT,
  county TEXT,
  state_code TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  geom GEOMETRY(GEOMETRY, 4326),
  centroid GEOMETRY(POINT, 4326)
);

-- Create geo spatial indexes
CREATE INDEX IF NOT EXISTS property_val_geom_idx ON Property_val USING GIST (geom);
CREATE INDEX IF NOT EXISTS property_val_centroid_idx ON Property_val USING GIST (centroid);

-- Create temp table to verify if sample data already exists
DO $$
BEGIN
  CREATE TEMP TABLE temp_check AS
  SELECT COUNT(*) as count FROM Property_val WHERE prop_id = 'SAMPLE-0001';
EXCEPTION
  WHEN undefined_table THEN
    -- If Property_val doesn't exist yet
    CREATE TEMP TABLE temp_check AS SELECT 0 as count;
END $$;

-- Check if sample data already exists
DO $$
DECLARE
  sample_count INTEGER;
BEGIN
  SELECT count INTO sample_count FROM temp_check;
  
  -- Only insert if no sample data exists
  IF sample_count = 0 THEN
    -- Insert sample parcels with geometries
    INSERT INTO Property_val 
      (prop_id, address, owner_name, county, state_code, geom, centroid)
    VALUES
      (
        'SAMPLE-0001',
        '123 Main St, Los Angeles, CA 90001',
        'John Smith',
        'Los Angeles',
        'CA',
        ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-118.45,34.05],[-118.44,34.05],[-118.44,34.06],[-118.45,34.06],[-118.45,34.05]]]}'),
        ST_Centroid(ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-118.45,34.05],[-118.44,34.05],[-118.44,34.06],[-118.45,34.06],[-118.45,34.05]]]}'))
      ),
      (
        'SAMPLE-0002',
        '456 Oak Ave, Los Angeles, CA 90002',
        'Jane Doe',
        'Los Angeles',
        'CA',
        ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-118.46,34.06],[-118.45,34.06],[-118.45,34.07],[-118.46,34.07],[-118.46,34.06]]]}'),
        ST_Centroid(ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-118.46,34.06],[-118.45,34.06],[-118.45,34.07],[-118.46,34.07],[-118.46,34.06]]]}'))
      ),
      (
        'SAMPLE-0003',
        '789 Pine Rd, Los Angeles, CA 90003',
        'Robert Johnson',
        'Los Angeles',
        'CA',
        ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-118.44,34.04],[-118.43,34.04],[-118.43,34.05],[-118.44,34.05],[-118.44,34.04]]]}'),
        ST_Centroid(ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-118.44,34.04],[-118.43,34.04],[-118.43,34.05],[-118.44,34.05],[-118.44,34.04]]]}'))
      ),
      (
        'SAMPLE-0004',
        '101 Cedar Ln, Los Angeles, CA 90004',
        'Mary Williams',
        'Los Angeles',
        'CA',
        ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-118.47,34.04],[-118.46,34.04],[-118.46,34.05],[-118.47,34.05],[-118.47,34.04]]]}'),
        ST_Centroid(ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-118.47,34.04],[-118.46,34.04],[-118.46,34.05],[-118.47,34.05],[-118.47,34.04]]]}'))
      ),
      (
        'SAMPLE-0005',
        '202 Maple Dr, Los Angeles, CA 90005',
        'David Brown',
        'Los Angeles',
        'CA',
        ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-118.42,34.05],[-118.41,34.05],[-118.41,34.06],[-118.42,34.06],[-118.42,34.05]]]}'),
        ST_Centroid(ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-118.42,34.05],[-118.41,34.05],[-118.41,34.06],[-118.42,34.06],[-118.42,34.05]]]}'))
      );
      
    -- Log success
    RAISE NOTICE 'Sample parcel data loaded successfully';
  ELSE
    RAISE NOTICE 'Sample parcel data already exists, skipping insertion';
  END IF;
END $$;

-- Clean up temp table
DROP TABLE temp_check;
EOSQL

# Execute the SQL file
echo "Executing SQL to load sample data..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f /tmp/sample_parcels.sql

# Check if the command succeeded
if [ $? -eq 0 ]; then
  echo "Sample GIS data loaded successfully"
else
  echo "Error loading sample GIS data"
  exit 1
fi

# Remove the temporary SQL file
rm /tmp/sample_parcels.sql

# Cleanup
unset PGPASSWORD

echo "Done loading GIS sample data"