-- V4__enable_postgis.sql
-- Enables the PostGIS extension for spatial data functionality

-- Enable the PostGIS extension if it doesn't already exist
CREATE EXTENSION IF NOT EXISTS postgis;

-- Log that the PostGIS extension has been enabled
DO $$
BEGIN
  RAISE NOTICE 'PostGIS extension has been enabled';
END $$;