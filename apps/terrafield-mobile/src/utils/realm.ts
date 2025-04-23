import Realm from 'realm';
import { User } from '../services/auth.service';

// Schema version - increment this when changing schemas
const SCHEMA_VERSION = 1;

// Parcel schema
export class ParcelSchema extends Realm.Object<ParcelSchema> {
  _id!: string; // This will be the same as parcelId from API
  address!: string;
  city!: string;
  state!: string;
  zipCode!: string;
  latitude!: number;
  longitude!: number;
  acres!: number;
  assessedValue!: number;
  ownerName!: string;
  lastSync!: Date;
  isLocalOnly!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static schema = {
    name: 'Parcel',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      address: 'string',
      city: 'string',
      state: 'string',
      zipCode: 'string',
      latitude: 'double',
      longitude: 'double',
      acres: 'double',
      assessedValue: 'double',
      ownerName: 'string',
      lastSync: 'date',
      isLocalOnly: 'bool',
      createdAt: 'date',
      updatedAt: 'date'
    }
  };
}

// Parcel note schema
export class ParcelNoteSchema extends Realm.Object<ParcelNoteSchema> {
  _id!: string; // This will be generated locally
  parcelId!: string; // This references the parent parcel
  content!: string;
  yDocData!: string; // Base64 encoded Y.Doc update for CRDT sync
  syncCount!: number;
  lastSync!: Date;
  isLocalOnly!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  static schema = {
    name: 'ParcelNote',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      parcelId: 'string',
      content: 'string',
      yDocData: 'string',
      syncCount: 'int',
      lastSync: 'date',
      isLocalOnly: 'bool',
      createdAt: 'date',
      updatedAt: 'date'
    }
  };
}

// User schema for storing local user info
export class UserSchema extends Realm.Object<UserSchema> {
  _id!: string; // User ID from API
  username!: string;
  email!: string;
  role!: string;
  token!: string;
  tokenExpiry!: Date;
  lastSync!: Date;
  
  static schema = {
    name: 'User',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      username: 'string',
      email: 'string',
      role: 'string',
      token: 'string',
      tokenExpiry: 'date',
      lastSync: 'date'
    }
  };
}

// Sync queue for tracking operations to sync with server when online
export class SyncQueueSchema extends Realm.Object<SyncQueueSchema> {
  _id!: string; // UUID for the operation
  operationType!: string; // 'create', 'update', 'delete'
  entityType!: string; // 'parcel', 'note'
  entityId!: string; // ID of the entity being changed
  data!: string; // JSON stringified data
  attempts!: number; // Number of sync attempts
  createdAt!: Date;
  
  static schema = {
    name: 'SyncQueue',
    primaryKey: '_id',
    properties: {
      _id: 'string',
      operationType: 'string',
      entityType: 'string',
      entityId: 'string',
      data: 'string',
      attempts: 'int',
      createdAt: 'date'
    }
  };
}

// Realm configuration
const realmConfig: Realm.Configuration = {
  schema: [ParcelSchema, ParcelNoteSchema, UserSchema, SyncQueueSchema],
  schemaVersion: SCHEMA_VERSION,
  migration: (oldRealm, newRealm) => {
    // Handle migrations here when schema changes
    const oldVersion = oldRealm.schemaVersion;
    
    if (oldVersion < 1) {
      // Migration from pre-1.0 to 1.0
      // ... migration code would go here
    }
    
    // Add more version migrations as needed
  }
};

// Initialize Realm
let realmInstance: Realm | null = null;

// Get Realm instance (singleton pattern)
export async function getRealm(): Promise<Realm> {
  if (!realmInstance) {
    realmInstance = await Realm.open(realmConfig);
  }
  return realmInstance;
}

// Close Realm connection
export function closeRealm() {
  if (realmInstance) {
    realmInstance.close();
    realmInstance = null;
  }
}

// Save user to Realm
export async function saveUser(user: User & { token: string }): Promise<void> {
  const realm = await getRealm();
  try {
    realm.write(() => {
      realm.create('User', {
        _id: user.id.toString(),
        username: user.username,
        email: user.email || '',
        role: user.role,
        token: user.token,
        tokenExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        lastSync: new Date()
      }, Realm.UpdateMode.Modified);
    });
  } catch (error) {
    console.error('Error saving user to Realm:', error);
    throw error;
  }
}

// Get user from Realm
export async function getUser(): Promise<(User & { token: string }) | null> {
  const realm = await getRealm();
  const users = realm.objects<UserSchema>('User');
  
  if (users.length === 0) {
    return null;
  }
  
  // Convert from Realm object to plain object
  const user = users[0];
  return {
    id: parseInt(user._id),
    username: user.username,
    email: user.email,
    role: user.role,
    token: user.token
  };
}

// Delete user from Realm (for logout)
export async function deleteUser(): Promise<void> {
  const realm = await getRealm();
  try {
    realm.write(() => {
      const users = realm.objects('User');
      realm.delete(users);
    });
  } catch (error) {
    console.error('Error deleting user from Realm:', error);
    throw error;
  }
}

// Save parcel to Realm
export async function saveParcel(parcel: any): Promise<void> {
  const realm = await getRealm();
  try {
    realm.write(() => {
      realm.create('Parcel', {
        _id: parcel.id,
        address: parcel.address || '',
        city: parcel.city || '',
        state: parcel.state || '',
        zipCode: parcel.zipCode || '',
        latitude: parcel.latitude || 0,
        longitude: parcel.longitude || 0,
        acres: parcel.acres || 0,
        assessedValue: parcel.assessedValue || 0,
        ownerName: parcel.ownerName || '',
        lastSync: new Date(),
        isLocalOnly: parcel.isLocalOnly || false,
        createdAt: parcel.createdAt ? new Date(parcel.createdAt) : new Date(),
        updatedAt: new Date()
      }, Realm.UpdateMode.Modified);
    });
  } catch (error) {
    console.error('Error saving parcel to Realm:', error);
    throw error;
  }
}

// Get parcels from Realm
export async function getParcels(): Promise<any[]> {
  const realm = await getRealm();
  const parcels = realm.objects<ParcelSchema>('Parcel');
  
  // Convert to plain JS objects
  return Array.from(parcels).map(parcel => ({
    id: parcel._id,
    address: parcel.address,
    city: parcel.city,
    state: parcel.state,
    zipCode: parcel.zipCode,
    latitude: parcel.latitude,
    longitude: parcel.longitude,
    acres: parcel.acres,
    assessedValue: parcel.assessedValue,
    ownerName: parcel.ownerName,
    isLocalOnly: parcel.isLocalOnly,
    createdAt: parcel.createdAt.toISOString(),
    updatedAt: parcel.updatedAt.toISOString()
  }));
}

// Get parcel by ID
export async function getParcel(id: string): Promise<any | null> {
  const realm = await getRealm();
  const parcel = realm.objectForPrimaryKey<ParcelSchema>('Parcel', id);
  
  if (!parcel) {
    return null;
  }
  
  return {
    id: parcel._id,
    address: parcel.address,
    city: parcel.city,
    state: parcel.state,
    zipCode: parcel.zipCode,
    latitude: parcel.latitude,
    longitude: parcel.longitude,
    acres: parcel.acres,
    assessedValue: parcel.assessedValue,
    ownerName: parcel.ownerName,
    isLocalOnly: parcel.isLocalOnly,
    createdAt: parcel.createdAt.toISOString(),
    updatedAt: parcel.updatedAt.toISOString()
  };
}

// Save parcel note to Realm
export async function saveParcelNote(note: any): Promise<string> {
  const realm = await getRealm();
  let noteId = note._id || `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    realm.write(() => {
      realm.create('ParcelNote', {
        _id: noteId,
        parcelId: note.parcelId,
        content: note.content || '',
        yDocData: note.yDocData || '',
        syncCount: note.syncCount || 0,
        lastSync: new Date(),
        isLocalOnly: note.isLocalOnly || false,
        createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
        updatedAt: new Date()
      }, Realm.UpdateMode.Modified);
    });
    
    return noteId;
  } catch (error) {
    console.error('Error saving note to Realm:', error);
    throw error;
  }
}

// Get note by parcel ID
export async function getNoteByParcelId(parcelId: string): Promise<any | null> {
  const realm = await getRealm();
  const notes = realm.objects<ParcelNoteSchema>('ParcelNote').filtered('parcelId = $0', parcelId);
  
  if (notes.length === 0) {
    return null;
  }
  
  const note = notes[0];
  return {
    id: note._id,
    parcelId: note.parcelId,
    content: note.content,
    yDocData: note.yDocData,
    syncCount: note.syncCount,
    isLocalOnly: note.isLocalOnly,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString()
  };
}

// Add item to sync queue
export async function addToSyncQueue(
  operationType: 'create' | 'update' | 'delete',
  entityType: 'parcel' | 'note',
  entityId: string,
  data: any
): Promise<void> {
  const realm = await getRealm();
  const queueId = `${operationType}_${entityType}_${entityId}_${Date.now()}`;
  
  try {
    realm.write(() => {
      realm.create('SyncQueue', {
        _id: queueId,
        operationType,
        entityType,
        entityId,
        data: JSON.stringify(data),
        attempts: 0,
        createdAt: new Date()
      });
    });
  } catch (error) {
    console.error('Error adding to sync queue:', error);
    throw error;
  }
}

// Get sync queue items
export async function getSyncQueue(): Promise<any[]> {
  const realm = await getRealm();
  const queue = realm.objects<SyncQueueSchema>('SyncQueue').sorted('createdAt');
  
  return Array.from(queue).map(item => ({
    id: item._id,
    operationType: item.operationType,
    entityType: item.entityType,
    entityId: item.entityId,
    data: JSON.parse(item.data),
    attempts: item.attempts,
    createdAt: item.createdAt.toISOString()
  }));
}

// Remove item from sync queue
export async function removeFromSyncQueue(id: string): Promise<void> {
  const realm = await getRealm();
  try {
    realm.write(() => {
      const item = realm.objectForPrimaryKey('SyncQueue', id);
      if (item) {
        realm.delete(item);
      }
    });
  } catch (error) {
    console.error('Error removing from sync queue:', error);
    throw error;
  }
}

// Increment sync attempt counter
export async function incrementSyncAttempt(id: string): Promise<void> {
  const realm = await getRealm();
  try {
    realm.write(() => {
      const item = realm.objectForPrimaryKey<SyncQueueSchema>('SyncQueue', id);
      if (item) {
        item.attempts += 1;
      }
    });
  } catch (error) {
    console.error('Error incrementing sync attempt:', error);
    throw error;
  }
}

export default {
  getRealm,
  closeRealm,
  saveUser,
  getUser,
  deleteUser,
  saveParcel,
  getParcels,
  getParcel,
  saveParcelNote,
  getNoteByParcelId,
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  incrementSyncAttempt
};