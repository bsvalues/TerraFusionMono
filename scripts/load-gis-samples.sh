#!/bin/bash

# Load GIS Sample Data Script
# This script loads sample parcel geometries for testing the GIS functionality

echo "Loading sample parcel geometries for testing..."

# Get the database connection string from environment
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/postgres}"

# Extract parts from the connection string using regex
if [[ $DB_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASS="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]}"
  DB_NAME="${BASH_REMATCH[5]}"
else
  echo "Error: Could not parse DATABASE_URL"
  exit 1
fi

export PGPASSWORD="$DB_PASS"

# Create a temporary SQL file with sample data
cat > /tmp/sample_parcels.sql << 'EOSQL'
-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create temp table to verify if sample data already exists
CREATE TEMP TABLE temp_check AS
SELECT COUNT(*) as count FROM Property_val WHERE prop_id = 'SAMPLE-0001';

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