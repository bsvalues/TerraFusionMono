#!/bin/bash
# TerraFusion Parcel Shapefile Import Script
# This script imports parcel boundary shapefiles into PostGIS
# Transforms coordinate system from EPSG:2927 to EPSG:4326 (WGS84)

set -e  # Exit on any error

# Default shapefile path (can be overridden with -f flag)
SHAPEFILE_PATH="/mnt/data/dbo_PARCELSANDASSESS.shp"
SCHEMA="appraisal"  # Default schema as specified in documentation
TABLE_NAME="Property_val"  # Default table name

# Parse command line arguments
while getopts ":f:h:d:u:p:s:t:" opt; do
  case ${opt} in
    f )
      SHAPEFILE_PATH=$OPTARG
      ;;
    h )
      DB_HOST=$OPTARG
      ;;
    d )
      DB_NAME=$OPTARG
      ;;
    u )
      DB_USER=$OPTARG
      ;;
    p )
      DB_PASS=$OPTARG
      ;;
    s )
      SCHEMA=$OPTARG
      ;;
    t )
      TABLE_NAME=$OPTARG
      ;;
    \? )
      echo "Invalid option: $OPTARG" 1>&2
      ;;
    : )
      echo "Invalid option: $OPTARG requires an argument" 1>&2
      ;;
  esac
done

# If database connection details not provided, get them from DATABASE_URL
if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASS" ]; then
  echo "Database connection details not provided via command line flags."
  echo "Attempting to extract from DATABASE_URL environment variable..."
  
  DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/postgres}"
  
  # Extract parts from the connection string
  if [[ $DB_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
  elif [[ $DB_URL =~ postgres://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
  else
    echo "Error: Could not parse DATABASE_URL format"
    exit 1
  fi
fi

# Check if the shapefile exists
if [ ! -f "$SHAPEFILE_PATH" ]; then
  echo "Error: Shapefile not found at $SHAPEFILE_PATH"
  echo "Please specify a valid shapefile path with the -f flag"
  exit 1
fi

echo "==============================================="
echo "TerraFusion Parcel Shapefile Import Utility"
echo "==============================================="
echo "Shapefile path: $SHAPEFILE_PATH"
echo "Database host: $DB_HOST"
echo "Database name: $DB_NAME"
echo "Schema: $SCHEMA"
echo "Target table: $SCHEMA.$TABLE_NAME"
echo ""

# Export PGPASSWORD for psql
export PGPASSWORD="$DB_PASS"

# Check if ogr2ogr is installed
if ! command -v ogr2ogr &> /dev/null; then
  echo "Error: ogr2ogr not found. Please install GDAL/OGR tools."
  exit 1
fi

echo "Creating staging table for shapefile import..."
psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "
  DROP TABLE IF EXISTS ${SCHEMA}.parcel_shp_staging;
  CREATE TABLE ${SCHEMA}.parcel_shp_staging (
    prop_id    integer,
    centroid_x double precision,
    centroid_y double precision,
    shape_area double precision,
    geom_src   geometry(Polygon,2927)
  );
"

echo "Importing shapefile into staging table with coordinate transformation (EPSG:2927 → EPSG:4326)..."
ogr2ogr \
  -f "PostgreSQL" \
  PG:"host=$DB_HOST dbname=$DB_NAME user=$DB_USER password=$DB_PASS" \
  "$SHAPEFILE_PATH" \
  -nln ${SCHEMA}.parcel_shp_staging \
  -nlt PROMOTE_TO_MULTI \
  -t_srs EPSG:4326 \
  -lco GEOMETRY_NAME=geom_src \
  -lco FID=prop_id \
  -lco PRECISION=NO

echo "Creating or updating geometry columns in target table..."
psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "
  -- Ensure the geom column exists
  DO \$\$
  BEGIN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = '${SCHEMA}'
        AND table_name = '${TABLE_NAME}'
        AND column_name = 'geom'
    ) THEN
      ALTER TABLE ${SCHEMA}.${TABLE_NAME} ADD COLUMN geom geometry(Geometry, 4326);
    END IF;
  
    -- Ensure the centroid column exists
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = '${SCHEMA}'
        AND table_name = '${TABLE_NAME}'
        AND column_name = 'centroid'
    ) THEN
      ALTER TABLE ${SCHEMA}.${TABLE_NAME} ADD COLUMN centroid geography(Point, 4326);
    END IF;
  END
  \$\$;
"

echo "Copying geometries from staging to production table..."
psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "
  -- Update the geom column in target table
  UPDATE ${SCHEMA}.${TABLE_NAME} AS p
  SET geom = s.geom_src
  FROM ${SCHEMA}.parcel_shp_staging AS s
  WHERE p.prop_id = s.prop_id::text;

  -- Update centroid based on geometry, cast to geography type
  UPDATE ${SCHEMA}.${TABLE_NAME}
  SET centroid = ST_Centroid(geom)::geography
  WHERE geom IS NOT NULL;

  -- Create spatial indexes if they don't exist
  CREATE INDEX IF NOT EXISTS idx_${TABLE_NAME}_geom ON ${SCHEMA}.${TABLE_NAME} USING GIST (geom);
  CREATE INDEX IF NOT EXISTS idx_${TABLE_NAME}_centroid ON ${SCHEMA}.${TABLE_NAME} USING GIST (centroid);
"

echo "Cleaning up staging table..."
psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "
  DROP TABLE ${SCHEMA}.parcel_shp_staging;
"

echo "Verifying import by checking a sample of records..."
psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "
  SELECT prop_id, ST_AsText(ST_Centroid(geom)) as centroid_point
  FROM ${SCHEMA}.${TABLE_NAME}
  WHERE geom IS NOT NULL
  LIMIT 5;
"

echo "Testing simple spatial query performance..."
psql -h "$DB_HOST" -d "$DB_NAME" -U "$DB_USER" -c "
  EXPLAIN ANALYZE
  SELECT count(*)
  FROM ${SCHEMA}.${TABLE_NAME}
  WHERE geom && ST_MakeEnvelope(-123.0, 45.0, -122.0, 46.0, 4326);
"

# Clean up
unset PGPASSWORD

echo "==============================================="
echo "Parcel shapefile import complete!"
echo "Geometries have been loaded into ${SCHEMA}.${TABLE_NAME}"
echo "==============================================="
echo "Next steps:"
echo "1. Test your GIS API endpoints"
echo "2. Verify parcel visualization in the map interface"
echo "3. Run any additional spatial analysis queries"
echo ""