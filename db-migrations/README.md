# TerraFusion Database Migrations

This directory contains the Flyway database migration scripts for the TerraFusion platform. These migrations handle the evolution of the database schema in a controlled and repeatable manner.

## Directory Structure

- `migrations/`: Contains versioned SQL migration scripts
- `scripts/`: Contains utility scripts for database operations
- `flyway.conf`: Configuration file for Flyway
- `run-migrations.sh`: Script to run migration commands

## Migration Naming Convention

Flyway migrations follow a specific naming pattern:

```
V{version}__{description}.sql
```

For example:
- `V4__enable_postgis.sql`
- `V5__add_parcel_geom.sql`
- `V6__create_geojson_helpers.sql`

## GIS-specific Migrations

The following migrations are specifically related to GIS (Geographic Information System) functionality:

1. **V4__enable_postgis.sql**
   - Enables the PostGIS extension
   - Creates a GIS schema
   - Sets up spatial reference systems

2. **V5__add_parcel_geom.sql**
   - Adds geometry columns to the parcels table
   - Creates spatial indexes
   - Sets up triggers for automatic centroid calculation

3. **V6__create_geojson_helpers.sql**
   - Creates utility functions for converting between GeoJSON and PostGIS geometries
   - Implements spatial query functions for finding parcels

## Running Migrations

To run migrations, use the provided script from the project root:

```bash
./run-db-migrations.sh [command]
```

Available commands:

- `migrate`: Apply pending migrations
- `clean`: Remove all objects from the schema (use with caution!)
- `info`: Print information about applied and pending migrations
- `validate`: Validate applied migrations against the filesystem
- `repair`: Repair the schema history table
- `baseline`: Baseline an existing database
- `sample`: Load sample parcel geometries (for development)

## Sample Data

For development and testing purposes, you can load sample parcel geometries:

```bash
./run-db-migrations.sh sample
```

This will create five sample parcels with different geometry types.

## CI/CD Integration

These migrations are validated in the CI pipeline to ensure they can be applied cleanly to a fresh database. See `.github/workflows/ci.yml` for the implementation.

## Important Notes

1. **Never modify an existing migration** that has been applied to any environment. Instead, create a new migration to make the desired changes.

2. **Test migrations locally** before committing them.

3. **Use idempotent scripts** when possible, with conditional logic (e.g., `IF NOT EXISTS`).

4. The `parcels` table uses both PostGIS geometry columns and text columns to store the GeoJSON representation for easier integration with the ORM.

5. Spatial indexes are automatically created for optimal performance.

## Troubleshooting

Common issues:

1. **"PostGIS not available" error**: Make sure the PostGIS extension is installed on your database server.

2. **"Permission denied" on run-migrations.sh**: Make it executable with `chmod +x run-migrations.sh`.

3. **"Connection refused"**: Check the database connection parameters in flyway.conf.

4. **Failed migration**: Use `./run-db-migrations.sh repair` to repair the schema history, then try again.