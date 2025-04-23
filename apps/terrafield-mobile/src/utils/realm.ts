import Realm from 'realm';
import { ParcelSchema, ParcelMeasurementSchema } from '../models/ParcelSchema';

const ParcelNoteSchema = {
  name: 'ParcelNote',
  primaryKey: 'parcelId',
  properties: {
    parcelId: 'string',
    yDocData: 'string', // Base64 encoded Y.Doc update
    content: 'string?', // Plain text content (for display/search)
    updatedAt: 'date',
    category: { type: 'string', default: 'general' },
    syncCount: { type: 'int', default: 0 },
    isImportant: { type: 'bool', default: false },
  },
};

const SyncQueueSchema = {
  name: 'SyncQueue',
  properties: {
    parcelId: 'string',
    update: 'string', // Base64 encoded Y.Doc update
    timestamp: 'date',
  },
};

const ParcelSyncSchema = {
  name: 'ParcelSync',
  primaryKey: 'parcelId',
  properties: {
    parcelId: 'string',
    lastSyncAttempt: 'date?',
    lastSuccessfulSync: 'date?',
    syncStatus: { type: 'string', default: 'pending' }, // pending, success, failed
    errorMessage: 'string?',
    retryCount: { type: 'int', default: 0 },
  },
};

/**
 * Get a Realm instance with all schemas
 */
export const getRealmInstance = () => {
  return new Realm({
    schema: [
      ParcelNoteSchema,
      SyncQueueSchema,
      ParcelSchema,
      ParcelMeasurementSchema,
      ParcelSyncSchema
    ],
    schemaVersion: 2,
    migration: (oldRealm, newRealm) => {
      // If this is a newly created realm, there's nothing to migrate
      if (oldRealm.schemaVersion < 1) {
        return;
      }
      
      // Handle schema changes between versions 1 and 2
      if (oldRealm.schemaVersion < 2) {
        // Migration code would go here
        // For simplicity in this prototype, we're not detailing all migration steps
      }
    }
  });
};

/**
 * Helper to format Realm objects as plain objects
 */
export function realmObjectToPlain(obj: any): any {
  if (!obj) return null;
  
  // Check if it's a Realm object
  const isRealmObject = obj.constructor.name === 'RealmObject';
  const plainObj: any = {};
  
  // Get all the property names
  const keys = isRealmObject ? Object.keys(obj) : obj.keys?.() || Object.keys(obj);
  
  for (const key of keys) {
    if (key !== '_objectSchema' && key !== 'realm') {
      const value = obj[key];
      
      if (Array.isArray(value)) {
        plainObj[key] = Array.from(value).map(item => realmObjectToPlain(item));
      } else if (value && typeof value === 'object' && value.constructor.name === 'RealmObject') {
        plainObj[key] = realmObjectToPlain(value);
      } else {
        plainObj[key] = value;
      }
    }
  }
  
  return plainObj;
}