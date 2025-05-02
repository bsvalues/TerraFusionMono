-- V5__add_parcel_geom.sql
-- Add geometry columns to parcels table

-- Check if the parcels table exists; if not, create a minimal version
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parcels') THEN
        CREATE TABLE parcels (
            id SERIAL PRIMARY KEY,
            parcel_id VARCHAR(50) UNIQUE NOT NULL,
            address VARCHAR(255),
            owner_name VARCHAR(255),
            county VARCHAR(100),
            state_code VARCHAR(2),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        RAISE NOTICE 'Created parcels table as it did not exist';
    ELSE
        RAISE NOTICE 'Parcels table already exists';
    END IF;
END $$;

-- Add geometry column for parcel boundary if it doesn't exist
-- We're using SRID 4326 (WGS84) which is standard for GPS/web mapping
DO $$ 
BEGIN
    -- Check if the geometry column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'parcels' AND column_name = 'boundary_geom'
    ) THEN
        -- Add geometry column using PostGIS function
        PERFORM AddGeometryColumn('public', 'parcels', 'boundary_geom', 4326, 'POLYGON', 2);
        RAISE NOTICE 'Added boundary_geom column to parcels table';
    ELSE
        RAISE NOTICE 'boundary_geom column already exists in parcels table';
    END IF;
END $$;

-- Add geometry column for parcel centroid if it doesn't exist
DO $$ 
BEGIN
    -- Check if the geometry column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'parcels' AND column_name = 'centroid_geom'
    ) THEN
        -- Add geometry column using PostGIS function
        PERFORM AddGeometryColumn('public', 'parcels', 'centroid_geom', 4326, 'POINT', 2);
        RAISE NOTICE 'Added centroid_geom column to parcels table';
    ELSE
        RAISE NOTICE 'centroid_geom column already exists in parcels table';
    END IF;
END $$;

-- Add text columns to store GeoJSON representations (for compatibility with ORMs)
ALTER TABLE parcels
ADD COLUMN IF NOT EXISTS boundary_geojson TEXT,
ADD COLUMN IF NOT EXISTS centroid_geojson TEXT;

-- Create indexes on geometry columns for spatial queries
DO $$ 
BEGIN
    -- Check if indexes exist before creating them
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'parcels' AND indexname = 'idx_parcels_boundary_geom'
    ) THEN
        CREATE INDEX idx_parcels_boundary_geom ON parcels USING GIST (boundary_geom);
        RAISE NOTICE 'Created spatial index on boundary_geom';
    ELSE
        RAISE NOTICE 'Spatial index on boundary_geom already exists';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE tablename = 'parcels' AND indexname = 'idx_parcels_centroid_geom'
    ) THEN
        CREATE INDEX idx_parcels_centroid_geom ON parcels USING GIST (centroid_geom);
        RAISE NOTICE 'Created spatial index on centroid_geom';
    ELSE
        RAISE NOTICE 'Spatial index on centroid_geom already exists';
    END IF;
END $$;

-- Create a trigger to automatically update the centroid when boundary changes
CREATE OR REPLACE FUNCTION update_parcel_centroid()
RETURNS TRIGGER AS $$
BEGIN
    -- Set the centroid based on the boundary polygon
    IF NEW.boundary_geom IS NOT NULL THEN
        NEW.centroid_geom = ST_Centroid(NEW.boundary_geom);
        -- Also update GeoJSON representations
        NEW.boundary_geojson = ST_AsGeoJSON(NEW.boundary_geom);
        NEW.centroid_geojson = ST_AsGeoJSON(NEW.centroid_geom);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Check if trigger already exists before creating it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_parcel_centroid'
    ) THEN
        -- Create the trigger
        CREATE TRIGGER trg_update_parcel_centroid
        BEFORE INSERT OR UPDATE OF boundary_geom ON parcels
        FOR EACH ROW
        EXECUTE FUNCTION update_parcel_centroid();
        
        RAISE NOTICE 'Created trigger to update centroid when boundary changes';
    ELSE
        RAISE NOTICE 'Trigger for centroid update already exists';
    END IF;
END $$;