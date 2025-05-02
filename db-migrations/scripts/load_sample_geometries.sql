-- load_sample_geometries.sql
-- Optional script to load sample polygon data into the Property_val table
-- This should be run manually after the migrations are applied

-- Function to update property geometries with sample data
-- Each property gets a simple rectangle boundary based on its ID
CREATE OR REPLACE FUNCTION update_sample_geometries() RETURNS void AS $$
DECLARE
    prop RECORD;
    center_lat FLOAT;
    center_lng FLOAT;
    size FLOAT;
    geojson TEXT;
BEGIN
    -- Loop through all properties that don't have geometry yet
    FOR prop IN SELECT id FROM appraisal.Property_val WHERE geom IS NULL LIMIT 100
    LOOP
        -- Generate a random center point based on property ID
        -- This ensures consistent but "random" looking data
        center_lat := 40.0 + (prop.id % 100) * 0.01;
        center_lng := -98.0 - (prop.id % 50) * 0.02;
        
        -- Size varies slightly based on ID
        size := 0.005 + (prop.id % 10) * 0.001;
        
        -- Create a GeoJSON polygon (simple rectangle)
        geojson := format('{
            "type": "Polygon",
            "coordinates": [[
                [%s, %s],
                [%s, %s],
                [%s, %s],
                [%s, %s],
                [%s, %s]
            ]]
        }',
            center_lng - size, center_lat - size,
            center_lng + size, center_lat - size,
            center_lng + size, center_lat + size,
            center_lng - size, center_lat + size,
            center_lng - size, center_lat - size
        );
        
        -- Update the property with the new geometry
        -- Convert GeoJSON to PostGIS geometry
        UPDATE appraisal.Property_val
        SET geom = ST_GeomFromGeoJSON(geojson)
        WHERE id = prop.id;
        
        RAISE NOTICE 'Updated property % with geometry', prop.id;
    END LOOP;
    
    RAISE NOTICE 'Sample geometries loaded successfully';
END;
$$ LANGUAGE plpgsql;

-- Execute the function to load sample data
SELECT update_sample_geometries();

-- Drop the function as it's no longer needed
DROP FUNCTION update_sample_geometries();

-- Verify that geometries were added
SELECT COUNT(*) AS properties_with_geometry FROM appraisal.Property_val WHERE geom IS NOT NULL;