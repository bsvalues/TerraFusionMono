-- V5__add_parcel_geom.sql
-- Add geometry column to parcels table for parcel boundaries

-- Add the geom column to store PostGIS geometry (polygon)
ALTER TABLE parcels
  ADD COLUMN geom geometry(Polygon, 4326);

-- Create a spatial index on the geometry column for efficient spatial queries
CREATE INDEX idx_parcels_geom 
  ON parcels USING GIST(geom);

-- Add a trigger to automatically update the geom column when boundary (GeoJSON) is updated
CREATE OR REPLACE FUNCTION update_geom_from_boundary()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.boundary IS NOT NULL THEN
    -- Convert GeoJSON to PostGIS geometry
    NEW.geom = ST_SetSRID(ST_GeomFromGeoJSON(NEW.boundary::text), 4326);
    
    -- Update the center coordinates if they're not set
    IF NEW.centerLat IS NULL OR NEW.centerLng IS NULL THEN
      NEW.centerLat = ST_Y(ST_Centroid(NEW.geom));
      NEW.centerLng = ST_X(ST_Centroid(NEW.geom));
    END IF;
    
    -- Update the area in hectares if it's not set
    IF NEW.areaHectares IS NULL THEN
      -- Convert square meters to hectares (1 hectare = 10000 sq meters)
      NEW.areaHectares = ST_Area(ST_Transform(NEW.geom, 3857)) / 10000.0;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger before insert or update on parcels table
CREATE TRIGGER trg_parcels_boundary_to_geom
  BEFORE INSERT OR UPDATE OF boundary ON parcels
  FOR EACH ROW
  EXECUTE FUNCTION update_geom_from_boundary();