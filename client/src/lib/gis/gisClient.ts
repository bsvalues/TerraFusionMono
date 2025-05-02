/**
 * GIS client for interacting with the GIS GraphQL API
 * This module provides functions for spatial operations and querying
 */

import { apiRequest } from '../queryClient';

// GraphQL queries for GIS operations
const GIS_QUERIES = {
  // Get all parcels
  GET_PARCELS: `
    query GetParcels {
      parcels {
        id
        externalId
        name
        description
        centerPoint {
          lat
          lng
        }
        boundary
        geom
      }
    }
  `,
  
  // Get a specific parcel by ID
  GET_PARCEL: `
    query GetParcel($id: ID!) {
      parcel(id: $id) {
        id
        externalId
        name
        description
        centerPoint {
          lat
          lng
        }
        boundary
        geom
        perimeter
      }
    }
  `,
  
  // Find parcels near a point
  FIND_PARCELS_NEAR_POINT: `
    query FindParcelsNearPoint($lat: Float!, $lng: Float!, $radiusMeters: Float!) {
      spatial {
        nearby(lat: $lat, lng: $lng, radiusMeters: $radiusMeters) {
          id
          externalId
          name
          description
          centerPoint {
            lat
            lng
          }
          boundary
          geom
        }
      }
    }
  `,
  
  // Find parcels within a bounding box
  FIND_PARCELS_IN_BBOX: `
    query FindParcelsInBbox(
      $minLat: Float!, 
      $minLng: Float!, 
      $maxLat: Float!, 
      $maxLng: Float!
    ) {
      spatial {
        bbox(
          minLat: $minLat, 
          minLng: $minLng, 
          maxLat: $maxLat, 
          maxLng: $maxLng
        ) {
          id
          externalId
          name
          description
          centerPoint {
            lat
            lng
          }
          boundary
          geom
        }
      }
    }
  `,
  
  // Find parcels that intersect with a geometry
  FIND_PARCELS_INTERSECTING: `
    query FindParcelsIntersecting($wkt: WKT!) {
      spatial {
        intersects(geometryWkt: $wkt) {
          id
          externalId
          name
          description
          centerPoint {
            lat
            lng
          }
          boundary
          geom
        }
      }
    }
  `,
  
  // Check if a point is within a parcel
  IS_POINT_IN_PARCEL: `
    query IsPointInParcel($parcelId: ID!, $lat: Float!, $lng: Float!) {
      parcel(id: $parcelId) {
        id
        containsPoint(lat: $lat, lng: $lng)
      }
    }
  `,
  
  // Calculate distance between a point and parcel
  DISTANCE_TO_PARCEL: `
    query DistanceToParcel($parcelId: ID!, $lat: Float!, $lng: Float!) {
      parcel(id: $parcelId) {
        id
        distance(lat: $lat, lng: $lng)
      }
    }
  `,
  
  // Convert GeoJSON to WKT
  GEOJSON_TO_WKT: `
    query GeoJSONToWkt($geoJSON: GeoJSON!) {
      geoJSONToWkt(geoJSON: $geoJSON)
    }
  `,
  
  // Convert WKT to GeoJSON
  WKT_TO_GEOJSON: `
    query WktToGeoJSON($wkt: WKT!) {
      wktToGeoJSON(wkt: $wkt)
    }
  `,
};

/**
 * Client library for GIS operations
 */
export const gisClient = {
  /**
   * Get all parcels
   */
  async getParcels() {
    try {
      const response = await apiRequest('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: GIS_QUERIES.GET_PARCELS
        })
      });
      
      return response.data?.parcels || [];
    } catch (error) {
      console.error('Error fetching parcels:', error);
      return [];
    }
  },
  
  /**
   * Get a specific parcel by ID
   */
  async getParcel(id: string | number) {
    try {
      const response = await apiRequest('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: GIS_QUERIES.GET_PARCEL,
          variables: { id: String(id) }
        })
      });
      
      return response.data?.parcel || null;
    } catch (error) {
      console.error(`Error fetching parcel ${id}:`, error);
      return null;
    }
  },
  
  /**
   * Find parcels near a point within a radius
   */
  async findParcelsNearPoint(lat: number, lng: number, radiusMeters: number) {
    try {
      const response = await apiRequest('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: GIS_QUERIES.FIND_PARCELS_NEAR_POINT,
          variables: { lat, lng, radiusMeters }
        })
      });
      
      return response.data?.spatial?.nearby || [];
    } catch (error) {
      console.error('Error finding parcels near point:', error);
      return [];
    }
  },
  
  /**
   * Find parcels within a bounding box
   */
  async findParcelsInBbox(minLat: number, minLng: number, maxLat: number, maxLng: number) {
    try {
      const response = await apiRequest('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: GIS_QUERIES.FIND_PARCELS_IN_BBOX,
          variables: { minLat, minLng, maxLat, maxLng }
        })
      });
      
      return response.data?.spatial?.bbox || [];
    } catch (error) {
      console.error('Error finding parcels in bbox:', error);
      return [];
    }
  },
  
  /**
   * Find parcels that intersect with a WKT geometry
   */
  async findParcelsIntersecting(wkt: string) {
    try {
      const response = await apiRequest('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: GIS_QUERIES.FIND_PARCELS_INTERSECTING,
          variables: { wkt }
        })
      });
      
      return response.data?.spatial?.intersects || [];
    } catch (error) {
      console.error('Error finding intersecting parcels:', error);
      return [];
    }
  },
  
  /**
   * Check if a point is within a parcel
   */
  async isPointInParcel(parcelId: string | number, lat: number, lng: number) {
    try {
      const response = await apiRequest('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: GIS_QUERIES.IS_POINT_IN_PARCEL,
          variables: { parcelId: String(parcelId), lat, lng }
        })
      });
      
      return response.data?.parcel?.containsPoint || false;
    } catch (error) {
      console.error('Error checking if point is in parcel:', error);
      return false;
    }
  },
  
  /**
   * Calculate distance between a point and parcel
   */
  async distanceToParcel(parcelId: string | number, lat: number, lng: number) {
    try {
      const response = await apiRequest('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: GIS_QUERIES.DISTANCE_TO_PARCEL,
          variables: { parcelId: String(parcelId), lat, lng }
        })
      });
      
      return response.data?.parcel?.distance || null;
    } catch (error) {
      console.error('Error calculating distance to parcel:', error);
      return null;
    }
  },
  
  /**
   * Convert GeoJSON to WKT
   */
  async geoJSONToWkt(geoJSON: any) {
    try {
      const response = await apiRequest('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: GIS_QUERIES.GEOJSON_TO_WKT,
          variables: { geoJSON }
        })
      });
      
      return response.data?.geoJSONToWkt || null;
    } catch (error) {
      console.error('Error converting GeoJSON to WKT:', error);
      return null;
    }
  },
  
  /**
   * Convert WKT to GeoJSON
   */
  async wktToGeoJSON(wkt: string) {
    try {
      const response = await apiRequest('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: GIS_QUERIES.WKT_TO_GEOJSON,
          variables: { wkt }
        })
      });
      
      return response.data?.wktToGeoJSON || null;
    } catch (error) {
      console.error('Error converting WKT to GeoJSON:', error);
      return null;
    }
  }
};