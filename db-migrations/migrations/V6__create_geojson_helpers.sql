-- V6__create_geojson_helpers.sql
-- Helper functions for working with GeoJSON and geometry types

-- Function to convert geometry to GeoJSON
CREATE OR REPLACE FUNCTION gis.geometry_to_geojson(geom GEOMETRY)
RETURNS TEXT AS $$
BEGIN
    IF geom IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN ST_AsGeoJSON(geom);
END;
$$ LANGUAGE plpgsql;

-- Function to convert GeoJSON to geometry
CREATE OR REPLACE FUNCTION gis.geojson_to_geometry(geojson TEXT, srid INT DEFAULT 4326)
RETURNS GEOMETRY AS $$
BEGIN
    IF geojson IS NULL OR geojson = '' THEN
        RETURN NULL;
    END IF;
    
    RETURN ST_SetSRID(ST_GeomFromGeoJSON(geojson), srid);
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Invalid GeoJSON provided: %', geojson;
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update parcel geometry from GeoJSON
CREATE OR REPLACE FUNCTION gis.update_parcel_geometry_from_geojson(
    p_parcel_id VARCHAR,
    p_geojson TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_geom GEOMETRY;
BEGIN
    -- Convert GeoJSON to geometry
    v_geom := gis.geojson_to_geometry(p_geojson);
    
    IF v_geom IS NULL THEN
        RAISE EXCEPTION 'Failed to convert GeoJSON to geometry';
        RETURN FALSE;
    END IF;
    
    -- Update the parcel's geometry
    UPDATE parcels
    SET 
        boundary_geom = v_geom,
        boundary_geojson = p_geojson,
        updated_at = CURRENT_TIMESTAMP
    WHERE parcel_id = p_parcel_id;
    
    -- The trigger will automatically update the centroid
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to find parcels within a given distance of a point
CREATE OR REPLACE FUNCTION gis.find_parcels_near_point(
    p_lat DOUBLE PRECISION,
    p_lon DOUBLE PRECISION,
    p_distance_meters DOUBLE PRECISION DEFAULT 1000
)
RETURNS TABLE (
    id INTEGER,
    parcel_id VARCHAR,
    address VARCHAR,
    owner_name VARCHAR,
    distance_meters DOUBLE PRECISION,
    boundary_geojson TEXT,
    centroid_geojson TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.parcel_id,
        p.address,
        p.owner_name,
        ST_Distance(
            p.centroid_geom,
            ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326),
            true
        ) AS distance_meters,
        p.boundary_geojson,
        p.centroid_geojson
    FROM 
        parcels p
    WHERE 
        ST_DWithin(
            p.centroid_geom,
            ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326),
            p_distance_meters / (111320 * COS(RADIANS(p_lat)))  -- Approximate conversion to degrees
        )
    ORDER BY 
        distance_meters ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to find parcels within a polygon
CREATE OR REPLACE FUNCTION gis.find_parcels_in_polygon(
    p_polygon_geojson TEXT
)
RETURNS TABLE (
    id INTEGER,
    parcel_id VARCHAR,
    address VARCHAR,
    owner_name VARCHAR,
    boundary_geojson TEXT,
    centroid_geojson TEXT
) AS $$
DECLARE
    v_geom GEOMETRY;
BEGIN
    -- Convert GeoJSON to geometry
    v_geom := gis.geojson_to_geometry(p_polygon_geojson);
    
    IF v_geom IS NULL THEN
        RAISE EXCEPTION 'Failed to convert GeoJSON to geometry';
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id,
        p.parcel_id,
        p.address,
        p.owner_name,
        p.boundary_geojson,
        p.centroid_geojson
    FROM 
        parcels p
    WHERE 
        ST_Intersects(p.boundary_geom, v_geom)
    ORDER BY 
        p.parcel_id;
END;
$$ LANGUAGE plpgsql;

-- Create an area calculation function that handles null geometry
CREATE OR REPLACE FUNCTION gis.calculate_parcel_area(
    p_parcel_id VARCHAR,
    p_unit VARCHAR DEFAULT 'sqm'  -- 'sqm', 'sqft', 'acres', 'hectares'
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    v_area DOUBLE PRECISION;
    v_geom GEOMETRY;
BEGIN
    -- Get the parcel geometry
    SELECT boundary_geom INTO v_geom FROM parcels WHERE parcel_id = p_parcel_id;
    
    IF v_geom IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate area in square meters
    v_area := ST_Area(v_geom::geography);
    
    -- Convert based on requested unit
    CASE p_unit
        WHEN 'sqft' THEN
            v_area := v_area * 10.7639;  -- Square meters to square feet
        WHEN 'acres' THEN
            v_area := v_area * 0.000247105;  -- Square meters to acres
        WHEN 'hectares' THEN
            v_area := v_area * 0.0001;  -- Square meters to hectares
        ELSE
            -- Default is square meters, no conversion needed
    END CASE;
    
    RETURN v_area;
END;
$$ LANGUAGE plpgsql;