-- V6__create_geojson_helpers.sql
-- Creates helper functions for working with GeoJSON and WKT conversions

-- Create a function to convert a property's geometry to GeoJSON
CREATE OR REPLACE FUNCTION appraisal.property_geojson(property_id INT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', jsonb_build_array(
            jsonb_build_object(
                'type', 'Feature',
                'id', p.id,
                'geometry', ST_AsGeoJSON(p.geom)::jsonb,
                'properties', jsonb_build_object(
                    'id', p.id,
                    'name', p.name,
                    'description', p.description
                )
            )
        )
    ) INTO result
    FROM appraisal.Property_val p
    WHERE p.id = property_id AND p.geom IS NOT NULL;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update a property's geometry from GeoJSON
CREATE OR REPLACE FUNCTION appraisal.update_property_geom(property_id INT, geojson_data JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    success BOOLEAN := FALSE;
    geom GEOMETRY;
BEGIN
    -- Extract the geometry from the GeoJSON
    IF jsonb_typeof(geojson_data) = 'object' AND geojson_data->>'type' = 'FeatureCollection' THEN
        -- Handle FeatureCollection
        SELECT ST_GeomFromGeoJSON(features->0->'geometry')
        INTO geom
        FROM jsonb_array_elements(geojson_data->'features') AS features;
    ELSIF jsonb_typeof(geojson_data) = 'object' AND geojson_data->>'type' = 'Feature' THEN
        -- Handle Feature
        geom := ST_GeomFromGeoJSON(geojson_data->'geometry');
    ELSE
        -- Handle direct geometry
        geom := ST_GeomFromGeoJSON(geojson_data);
    END IF;
    
    -- Update the property with the new geometry
    IF geom IS NOT NULL THEN
        UPDATE appraisal.Property_val
        SET geom = geom
        WHERE id = property_id;
        
        GET DIAGNOSTICS success = ROW_COUNT;
    END IF;
    
    RETURN success;
END;
$$ LANGUAGE plpgsql;

-- Create a function to find properties that intersect with a given geometry
CREATE OR REPLACE FUNCTION appraisal.find_intersecting_properties(geojson_data JSONB)
RETURNS TABLE(
    id INT,
    name TEXT,
    description TEXT,
    intersection_area FLOAT
) AS $$
DECLARE
    input_geom GEOMETRY;
BEGIN
    -- Convert input GeoJSON to geometry
    input_geom := ST_GeomFromGeoJSON(geojson_data);
    
    -- Return properties that intersect with the input geometry
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        ST_Area(ST_Intersection(p.geom, input_geom)) AS intersection_area
    FROM 
        appraisal.Property_val p
    WHERE 
        p.geom IS NOT NULL AND
        ST_Intersects(p.geom, input_geom)
    ORDER BY 
        intersection_area DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to find properties within a given distance of a point
CREATE OR REPLACE FUNCTION appraisal.find_properties_near_point(
    lat FLOAT,
    lng FLOAT,
    distance_meters FLOAT
)
RETURNS TABLE(
    id INT,
    name TEXT,
    description TEXT,
    distance FLOAT
) AS $$
DECLARE
    point_geog GEOGRAPHY;
BEGIN
    -- Convert lat/lng to geography point
    point_geog := ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography;
    
    -- Return properties within the specified distance
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        ST_Distance(p.geom::geography, point_geog) AS distance
    FROM 
        appraisal.Property_val p
    WHERE 
        p.geom IS NOT NULL AND
        ST_DWithin(p.geom::geography, point_geog, distance_meters)
    ORDER BY 
        distance;
END;
$$ LANGUAGE plpgsql;