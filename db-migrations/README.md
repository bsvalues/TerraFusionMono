# TerraFusion Database Migrations

This directory contains database migrations for TerraFusion, managed using Flyway.

## PostGIS Migrations

### V4__enable_postgis.sql
Enables the PostGIS extension in the database, which provides:
- Spatial data types (geometry, geography)
- Spatial functions and operators
- Spatial indexing

### V5__add_parcel_geom.sql
Adds a geometry column to the `appraisal.Property_val` table for storing parcel boundaries:
- Creates a `geom` column with SRID 4326 (WGS84)
- Creates a spatial index using GiST for efficient spatial queries
- Adds appropriate metadata comments

## Running Migrations

Flyway will automatically run these migrations in order. To manually apply migrations:

```bash
flyway -configFiles=flyway.conf migrate
```

## Verification

After running migrations, verify the setup using these SQL commands:

```sql
-- Check that PostGIS is installed
SELECT postgis_full_version();

-- Check the Property_val table structure
\d appraisal.Property_val

-- Test a simple spatial query
SELECT COUNT(*) FROM appraisal.Property_val WHERE ST_IsValid(geom);
```

## Loading Sample Data

An optional script is provided to load sample geometry data:

```bash
psql -f db-migrations/scripts/load_sample_geometries.sql
```

## Testing Spatial Queries

After loading data, you can test spatial queries like:

```sql
-- Find properties within a bounding box
SELECT id, name 
FROM appraisal.Property_val 
WHERE ST_Intersects(geom, ST_MakeEnvelope(-98.1, 40.0, -97.9, 40.2, 4326));

-- Find properties near a point
SELECT id, name, ST_Distance(geom, ST_SetSRID(ST_Point(-98.0, 40.1), 4326)) AS distance
FROM appraisal.Property_val
WHERE ST_DWithin(geom, ST_SetSRID(ST_Point(-98.0, 40.1), 4326), 0.05)
ORDER BY distance;
```