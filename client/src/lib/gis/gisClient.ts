import { queryClient } from "../queryClient";

// Define types for GIS data
export interface Parcel {
  id: string;
  parcel_id: string;
  address?: string;
  owner_name?: string;
  county?: string;
  state_code?: string;
  geom?: any; // GeoJSON
  centroid?: any; // GeoJSON
  created_at?: string;
  updated_at?: string;
}

export interface ParcelArea {
  parcel_id: string;
  area: number;
  unit: 'SQUARE_METERS' | 'SQUARE_FEET' | 'ACRES' | 'HECTARES';
}

export type AreaUnit = 'SQUARE_METERS' | 'SQUARE_FEET' | 'ACRES' | 'HECTARES';

// GIS Client API
export const gisClient = {
  // Fetch parcels within a bounding box
  fetchParcelsInBBox: async (bbox: [number, number, number, number]): Promise<Parcel[]> => {
    const query = `
      query ParcelsInBBox($bbox: [Float!]!) {
        parcelsInBBox(bbox: $bbox) {
          id
          parcel_id
          address
          owner_name
          county
          state_code
          geom
          centroid
        }
      }
    `;

    const response = await queryClient.fetchQuery({
      queryKey: ['gis', 'parcelsInBBox', bbox],
      queryFn: async () => {
        const result = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            variables: { bbox },
          }),
        });
        
        if (!result.ok) {
          throw new Error('Failed to fetch parcels in bounding box');
        }
        
        const data = await result.json();
        return data.data.parcelsInBBox;
      },
    });
    
    return response;
  },
  
  // Fetch parcels near a point
  fetchParcelsNear: async (lat: number, lon: number, radiusMeters: number = 500): Promise<Parcel[]> => {
    const query = `
      query ParcelsNear($lat: Float!, $lon: Float!, $radiusMeters: Float!) {
        parcelsNear(lat: $lat, lon: $lon, radiusMeters: $radiusMeters) {
          id
          parcel_id
          address
          owner_name
          geom
          centroid
        }
      }
    `;
    
    const response = await queryClient.fetchQuery({
      queryKey: ['gis', 'parcelsNear', lat, lon, radiusMeters],
      queryFn: async () => {
        const result = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            variables: { lat, lon, radiusMeters },
          }),
        });
        
        if (!result.ok) {
          throw new Error('Failed to fetch parcels near point');
        }
        
        const data = await result.json();
        return data.data.parcelsNear;
      },
    });
    
    return response;
  },
  
  // Get a single parcel by ID
  fetchParcel: async (id: string): Promise<Parcel | null> => {
    const query = `
      query Parcel($id: String!) {
        parcel(id: $id) {
          id
          parcel_id
          address
          owner_name
          county
          state_code
          geom
          centroid
          created_at
          updated_at
        }
      }
    `;
    
    const response = await queryClient.fetchQuery({
      queryKey: ['gis', 'parcel', id],
      queryFn: async () => {
        const result = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            variables: { id },
          }),
        });
        
        if (!result.ok) {
          throw new Error('Failed to fetch parcel');
        }
        
        const data = await result.json();
        return data.data.parcel;
      },
    });
    
    return response;
  },
  
  // Calculate the area of a parcel
  calculateParcelArea: async (id: string, unit: AreaUnit = 'SQUARE_METERS'): Promise<ParcelArea> => {
    const query = `
      query ParcelArea($id: String!, $unit: AreaUnit!) {
        parcelArea(id: $id, unit: $unit) {
          parcel_id
          area
          unit
        }
      }
    `;
    
    const response = await queryClient.fetchQuery({
      queryKey: ['gis', 'parcelArea', id, unit],
      queryFn: async () => {
        const result = await fetch('/api/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            variables: { id, unit },
          }),
        });
        
        if (!result.ok) {
          throw new Error('Failed to calculate parcel area');
        }
        
        const data = await result.json();
        return data.data.parcelArea;
      },
    });
    
    return response;
  },
  
  // Update a parcel's geometry
  updateParcelGeometry: async (parcelId: string, geojson: any): Promise<boolean> => {
    // This would typically be a mutation, but for this example we'll use a REST endpoint
    const response = await fetch(`/api/parcels/${parcelId}/geometry`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ geojson }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update parcel geometry');
    }
    
    // Invalidate related queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['gis', 'parcel', parcelId] });
    queryClient.invalidateQueries({ queryKey: ['gis', 'parcelsInBBox'] });
    queryClient.invalidateQueries({ queryKey: ['gis', 'parcelsNear'] });
    
    return true;
  },
};

export default gisClient;