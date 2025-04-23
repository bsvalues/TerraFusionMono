import Realm from 'realm';

/**
 * Realm schema for Parcel data, matching the database structure from the backend
 */
export const ParcelSchema = {
  name: 'Parcel',
  primaryKey: 'externalId',
  properties: {
    // Basic fields
    externalId: 'string', // Matches the server's external_id
    name: 'string',
    description: 'string?',
    
    // Geospatial data
    boundary: 'string?', // JSON string of GeoJSON polygon
    centerLat: 'double?',
    centerLng: 'double?',
    areaHectares: 'double?',
    
    // Agricultural data
    soilType: 'string?',
    soilPh: 'double?',
    soilOrganicMatter: 'double?', // Percentage
    currentCrop: 'string?',
    previousCrop: 'string?',
    plantingDate: 'date?',
    harvestDate: 'date?',
    
    // Irrigation data
    irrigationType: 'string?', // drip, sprinkler, flood, none
    irrigationSchedule: 'string?', // JSON string
    waterSource: 'string?',
    
    // Management data
    ownerId: 'int',
    accessRights: 'string?', // JSON string
    status: { type: 'string', default: 'active' },
    
    // Timestamps and sync status
    createdAt: 'date',
    updatedAt: 'date',
    lastVisited: 'date?',
    syncStatus: { type: 'string', default: 'pending' },
    lastSynced: 'date?',
    version: { type: 'int', default: 1 },
  },
};

/**
 * Realm schema for parcel measurements
 */
export const ParcelMeasurementSchema = {
  name: 'ParcelMeasurement',
  primaryKey: 'id',
  properties: {
    id: 'string', // Local UUID
    parcelId: 'string',
    timestamp: 'date',
    userId: 'int',
    measurementType: 'string', // soil, crop, water, pest, etc.
    value: 'double?',
    unit: 'string',
    location: 'string?', // JSON string of specific location within parcel
    notes: 'string?',
    deviceId: 'string?',
    syncStatus: { type: 'string', default: 'pending' },
  },
};

/**
 * Default creation parameters for a new Parcel
 */
export interface NewParcelParams {
  externalId: string;
  name: string;
  ownerId: number;
  description?: string;
  centerLat?: number;
  centerLng?: number;
  status?: string;
}

/**
 * Creates a new Parcel object with default values
 */
export function createNewParcel(params: NewParcelParams): any {
  return {
    externalId: params.externalId,
    name: params.name,
    description: params.description || null,
    ownerId: params.ownerId,
    status: params.status || 'active',
    centerLat: params.centerLat || null,
    centerLng: params.centerLng || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    syncStatus: 'pending',
  };
}

/**
 * Interface for parcel measurement data
 */
export interface ParcelMeasurementData {
  parcelId: string;
  measurementType: string;
  value?: number;
  unit: string;
  timestamp?: Date;
  userId: number;
  location?: any;
  notes?: string;
  deviceId?: string;
}

/**
 * Creates a new parcel measurement object
 */
export function createMeasurement(data: ParcelMeasurementData): any {
  const uuid = 'measurement-' + Math.random().toString(36).substring(2, 15);
  
  return {
    id: uuid,
    parcelId: data.parcelId,
    timestamp: data.timestamp || new Date(),
    userId: data.userId,
    measurementType: data.measurementType,
    value: data.value || null,
    unit: data.unit,
    location: data.location ? JSON.stringify(data.location) : null,
    notes: data.notes || null,
    deviceId: data.deviceId || null,
    syncStatus: 'pending',
  };
}