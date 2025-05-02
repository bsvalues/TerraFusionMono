-- load_sample_geometries.sql
-- Load sample geometries for testing GIS functionality in TerraFusion

-- Begin transaction
BEGIN;

-- Create a function to avoid duplicate data
CREATE OR REPLACE FUNCTION insert_sample_parcel(
    p_parcel_id VARCHAR,
    p_address VARCHAR,
    p_owner_name VARCHAR,
    p_county VARCHAR,
    p_state_code VARCHAR,
    p_geojson TEXT
) RETURNS VOID AS $$
BEGIN
    -- Check if parcel_id already exists
    IF NOT EXISTS (SELECT 1 FROM parcels WHERE parcel_id = p_parcel_id) THEN
        -- Insert parcel without geometry
        INSERT INTO parcels (
            parcel_id, 
            address, 
            owner_name, 
            county, 
            state_code
        ) VALUES (
            p_parcel_id,
            p_address,
            p_owner_name,
            p_county,
            p_state_code
        );
        
        -- Update geometry using our helper function
        PERFORM gis.update_parcel_geometry_from_geojson(p_parcel_id, p_geojson);
        
        RAISE NOTICE 'Inserted sample parcel %', p_parcel_id;
    ELSE
        RAISE NOTICE 'Parcel % already exists, skipping', p_parcel_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Sample 1: Rectangle in New York City (Central Park area)
SELECT insert_sample_parcel(
    'NYC-CP-001',
    '59th St & 5th Ave, New York, NY',
    'City of New York',
    'New York',
    'NY',
    '{
        "type": "Polygon",
        "coordinates": [[
            [-73.9819, 40.7682],
            [-73.9492, 40.7682],
            [-73.9492, 40.7965],
            [-73.9819, 40.7965],
            [-73.9819, 40.7682]
        ]]
    }'
);

-- Sample 2: Triangle in San Francisco (Golden Gate Park)
SELECT insert_sample_parcel(
    'SF-GGP-001',
    'Golden Gate Park, San Francisco, CA',
    'City of San Francisco',
    'San Francisco',
    'CA',
    '{
        "type": "Polygon",
        "coordinates": [[
            [-122.5105, 37.7684],
            [-122.4562, 37.7684],
            [-122.4847, 37.7705],
            [-122.5105, 37.7684]
        ]]
    }'
);

-- Sample 3: Complex polygon in Austin (Downtown area)
SELECT insert_sample_parcel(
    'ATX-DT-001',
    'Downtown Austin, TX',
    'City of Austin',
    'Travis',
    'TX',
    '{
        "type": "Polygon",
        "coordinates": [[
            [-97.7515, 30.2610],
            [-97.7360, 30.2615],
            [-97.7320, 30.2700],
            [-97.7405, 30.2780],
            [-97.7530, 30.2730],
            [-97.7520, 30.2650],
            [-97.7515, 30.2610]
        ]]
    }'
);

-- Sample 4: Small rural parcel
SELECT insert_sample_parcel(
    'RURAL-001',
    'Rural Route 2, Smallville, KS',
    'Kent Family Farm',
    'Butler',
    'KS',
    '{
        "type": "Polygon",
        "coordinates": [[
            [-97.1099, 38.2025],
            [-97.1020, 38.2025],
            [-97.1020, 38.2080],
            [-97.1099, 38.2080],
            [-97.1099, 38.2025]
        ]]
    }'
);

-- Sample 5: Large agricultural plot
SELECT insert_sample_parcel(
    'AG-PLOT-001',
    'County Road 55, Farmville, IA',
    'Heartland Farms LLC',
    'Story',
    'IA',
    '{
        "type": "Polygon",
        "coordinates": [[
            [-93.6120, 42.0310],
            [-93.5950, 42.0310],
            [-93.5950, 42.0410],
            [-93.6120, 42.0410],
            [-93.6120, 42.0310]
        ]]
    }'
);

-- Clean up the temporary function
DROP FUNCTION IF EXISTS insert_sample_parcel;

-- Commit transaction
COMMIT;

-- Show counts for verification
SELECT 'Sample data loaded: ' || COUNT(*) || ' parcels with geometry' AS result 
FROM parcels 
WHERE boundary_geom IS NOT NULL;

-- Verify spatial queries work
SELECT 
    'Spatial query test result: ' || COUNT(*) || ' parcels found' AS result
FROM 
    gis.find_parcels_near_point(40.7800, -73.9700, 5000);  -- Near Central Park, NYC