-- V5__add_parcel_geom.sql
-- Adds a geometry column to the Property_val table for storing parcel boundaries

-- Add the geometry column to the Property_val table
ALTER TABLE appraisal.Property_val ADD COLUMN geom geometry(Geometry, 4326);

-- Create a spatial index for the geometry column
CREATE INDEX idx_property_val_geom ON appraisal.Property_val USING GIST (geom);

-- Comment on the column
COMMENT ON COLUMN appraisal.Property_val.geom IS 'Stores the geographical boundary of the property in standard WGS84 coordinates (SRID 4326)';

-- Log that the geometry column has been added
DO $$
BEGIN
  RAISE NOTICE 'Geometry column added to Property_val table with spatial index';
END $$;