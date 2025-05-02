import axios from 'axios';

// Types
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

// Client for GIS API
export const gisClient = {
  // Fetch parcels within a bounding box (west, south, east, north)
  fetchParcelsInBBox: async (bbox: [number, number, number, number]): Promise<Parcel[]> => {
    try {
      const response = await axios.get(`/api/gis/parcels/bbox`, {
        params: {
          west: bbox[0],
          south: bbox[1],
          east: bbox[2],
          north: bbox[3]
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching parcels in bounding box:', error);
      return [];
    }
  },

  // Fetch parcels near a point
  fetchParcelsNear: async (lat: number, lon: number, radiusMeters: number = 1000): Promise<Parcel[]> => {
    try {
      const response = await axios.get(`/api/gis/parcels/near`, {
        params: {
          lat,
          lon,
          radius: radiusMeters
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching parcels near point:', error);
      return [];
    }
  },

  // Fetch a single parcel by ID
  fetchParcel: async (id: string): Promise<Parcel> => {
    try {
      const response = await axios.get(`/api/gis/parcels/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching parcel ${id}:`, error);
      throw error;
    }
  },

  // Calculate the area of a parcel
  calculateParcelArea: async (id: string, unit: AreaUnit = 'SQUARE_METERS'): Promise<ParcelArea> => {
    try {
      const response = await axios.get(`/api/gis/parcels/${id}/area`, {
        params: { unit }
      });
      return response.data;
    } catch (error) {
      console.error(`Error calculating area for parcel ${id}:`, error);
      throw error;
    }
  },

  // Update a parcel's geometry
  updateParcelGeometry: async (parcelId: string, geojson: any): Promise<Parcel> => {
    try {
      const response = await axios.put(`/api/gis/parcels/${parcelId}/geometry`, {
        geometry: geojson
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating geometry for parcel ${parcelId}:`, error);
      throw error;
    }
  }
};