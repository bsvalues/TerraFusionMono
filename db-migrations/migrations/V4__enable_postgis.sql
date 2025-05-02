-- V4__enable_postgis.sql
-- Enable PostGIS extension for spatial data support

-- Check if PostGIS is already installed
DO $$ 
BEGIN
    -- Try to install PostGIS extension if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'postgis'
    ) THEN
        CREATE EXTENSION IF NOT EXISTS postgis;
        CREATE EXTENSION IF NOT EXISTS postgis_topology;
        RAISE NOTICE 'PostGIS extension installed successfully';
    ELSE
        RAISE NOTICE 'PostGIS extension already exists, no action taken';
    END IF;
END $$;

-- Create a spatial_ref_sys entry for the most common projection if it doesn't exist
-- EPSG:4326 is the WGS84 geographic coordinate system used by GPS
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM spatial_ref_sys WHERE srid = 4326
    ) THEN
        -- This would normally be inserted by the PostGIS extension, but we'll include it just in case
        INSERT INTO spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text)
        VALUES (
            4326,
            'EPSG',
            4326,
            'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]',
            '+proj=longlat +datum=WGS84 +no_defs'
        );
        RAISE NOTICE 'Added EPSG:4326 spatial reference system';
    ELSE
        RAISE NOTICE 'EPSG:4326 spatial reference system already exists';
    END IF;
END $$;

-- Create a GIS schema for organizing spatial objects and functions
CREATE SCHEMA IF NOT EXISTS gis;

-- Create a function to check if PostGIS is properly installed
CREATE OR REPLACE FUNCTION public.check_postgis_version()
RETURNS TABLE (
    postgis_full_version text,
    postgis_lib_version text,
    postgis_scripts_installed text,
    postgis_geos_version text,
    postgis_proj_version text,
    postgis_libxml_version text,
    postgis_topology_scripts_installed text
) 
LANGUAGE SQL
AS $$
    SELECT 
        postgis_full_version(),
        postgis_lib_version(),
        postgis_scripts_installed(),
        postgis_geos_version(),
        postgis_proj_version(),
        postgis_libxml_version(),
        postgis_topology_scripts_installed()
$$;

-- Log the successful installation
DO $$ 
BEGIN
    RAISE NOTICE 'PostGIS enabled successfully. Check version details with: SELECT * FROM public.check_postgis_version();';
END $$;