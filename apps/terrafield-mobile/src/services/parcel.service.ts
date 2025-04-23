import { Platform } from 'react-native';
import Realm from 'realm';
import { getRealmInstance } from '../utils/realm';
import { ParcelMeasurementData, createMeasurement, createNewParcel } from '../models/ParcelSchema';

// Base API URL - should come from environment in a real app
const API_URL = 'https://api.terrafusion.example/v1'; 

interface ParcelListParams {
  limit?: number;
  updatedSince?: Date;
  status?: string;
}

class ParcelService {
  private token: string | null = null;
  
  /**
   * Set the authentication token for API requests
   */
  setToken(token: string) {
    this.token = token;
  }
  
  /**
   * Get the headers for API requests
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': `TerraField-Mobile/${Platform.OS}`,
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
    };
  }
  
  /**
   * Fetch parcels from the server
   */
  async fetchParcels(params: ParcelListParams = {}): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.updatedSince) queryParams.append('updatedSince', params.updatedSince.toISOString());
      
      const queryString = queryParams.toString();
      const url = `${API_URL}/parcels${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      return this.saveParcelsToRealm(data);
      
    } catch (error) {
      console.error('Error fetching parcels:', error);
      throw error;
    }
  }
  
  /**
   * Save parcels to local Realm database
   */
  private saveParcelsToRealm(parcels: any[]): any[] {
    const realm = getRealmInstance();
    let savedParcels: any[] = [];
    
    try {
      realm.write(() => {
        parcels.forEach(parcel => {
          // Convert any JSON fields
          if (typeof parcel.boundary === 'object') {
            parcel.boundary = JSON.stringify(parcel.boundary);
          }
          if (typeof parcel.irrigationSchedule === 'object') {
            parcel.irrigationSchedule = JSON.stringify(parcel.irrigationSchedule);
          }
          if (typeof parcel.accessRights === 'object') {
            parcel.accessRights = JSON.stringify(parcel.accessRights);
          }
          
          // Convert date strings to Date objects
          if (parcel.createdAt && typeof parcel.createdAt === 'string') {
            parcel.createdAt = new Date(parcel.createdAt);
          }
          if (parcel.updatedAt && typeof parcel.updatedAt === 'string') {
            parcel.updatedAt = new Date(parcel.updatedAt);
          }
          if (parcel.lastVisited && typeof parcel.lastVisited === 'string') {
            parcel.lastVisited = new Date(parcel.lastVisited);
          }
          if (parcel.lastSynced && typeof parcel.lastSynced === 'string') {
            parcel.lastSynced = new Date(parcel.lastSynced);
          }
          if (parcel.plantingDate && typeof parcel.plantingDate === 'string') {
            parcel.plantingDate = new Date(parcel.plantingDate);
          }
          if (parcel.harvestDate && typeof parcel.harvestDate === 'string') {
            parcel.harvestDate = new Date(parcel.harvestDate);
          }
          
          // Create or update the parcel in Realm
          const savedParcel = realm.create('Parcel', parcel, Realm.UpdateMode.Modified);
          savedParcels.push(savedParcel);
        });
      });
      
      return savedParcels;
    } catch (error) {
      console.error('Error saving parcels to Realm:', error);
      throw error;
    }
  }
  
  /**
   * Get parcels from local Realm database
   */
  getParcelsFromRealm(filter?: string): any[] {
    const realm = getRealmInstance();
    let parcels = realm.objects('Parcel');
    
    if (filter) {
      parcels = parcels.filtered(filter);
    }
    
    return Array.from(parcels);
  }
  
  /**
   * Get a single parcel by ID
   */
  getParcel(externalId: string): any {
    const realm = getRealmInstance();
    return realm.objectForPrimaryKey('Parcel', externalId);
  }
  
  /**
   * Create a new parcel
   */
  async createParcel(parcelData: any): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/parcels`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(parcelData),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Save to local database
      return this.saveParcelsToRealm([data])[0];
    } catch (error) {
      console.error('Error creating parcel:', error);
      throw error;
    }
  }
  
  /**
   * Save a measurement to the local database and queue for sync
   */
  saveMeasurement(measurementData: ParcelMeasurementData): any {
    const realm = getRealmInstance();
    let savedMeasurement;
    
    try {
      realm.write(() => {
        const measurement = createMeasurement(measurementData);
        savedMeasurement = realm.create('ParcelMeasurement', measurement);
      });
      
      // Queue for sync (in a real app, would trigger sync process)
      this.queueMeasurementForSync(savedMeasurement.id);
      
      return savedMeasurement;
    } catch (error) {
      console.error('Error saving measurement:', error);
      throw error;
    }
  }
  
  /**
   * Get measurements for a specific parcel
   */
  getMeasurements(parcelId: string, filter?: string): any[] {
    const realm = getRealmInstance();
    let measurements = realm.objects('ParcelMeasurement')
      .filtered(`parcelId == "${parcelId}"`);
    
    if (filter) {
      measurements = measurements.filtered(filter);
    }
    
    return Array.from(measurements).sort((a: any, b: any) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
  }
  
  /**
   * Queue a measurement for sync with the server
   */
  private queueMeasurementForSync(measurementId: string): void {
    // In a real app, this would add to a sync queue and trigger sync
    console.log(`Queued measurement ${measurementId} for sync`);
  }
  
  /**
   * Update agricultural data for a parcel
   */
  updateParcelAgData(externalId: string, agData: any): any {
    const realm = getRealmInstance();
    let updatedParcel;
    
    try {
      realm.write(() => {
        const parcel = realm.objectForPrimaryKey('Parcel', externalId);
        if (!parcel) {
          throw new Error(`Parcel not found: ${externalId}`);
        }
        
        // Update agricultural fields
        Object.keys(agData).forEach(key => {
          if (parcel.hasOwnProperty(key)) {
            (parcel as any)[key] = agData[key];
          }
        });
        
        // Update metadata
        (parcel as any).updatedAt = new Date();
        (parcel as any).version += 1;
        (parcel as any).syncStatus = 'pending';
        
        updatedParcel = parcel;
      });
      
      // In a real app, would queue for sync with server
      
      return updatedParcel;
    } catch (error) {
      console.error('Error updating parcel agricultural data:', error);
      throw error;
    }
  }
}

export const parcelService = new ParcelService();