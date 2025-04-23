import Realm from 'realm';

// Define the ParcelNote schema
const ParcelNoteSchema = {
  name: 'ParcelNote',
  primaryKey: 'parcelId',
  properties: {
    parcelId: 'string',
    yDocData: 'string', // Base64 encoded Y.Doc update
    updatedAt: 'date',
  }
};

// Define the SyncQueue schema
const SyncQueueSchema = {
  name: 'SyncQueue',
  properties: {
    parcelId: 'string',
    update: 'string', // Base64 encoded update
    timestamp: 'date',
  }
};

// Singleton pattern for Realm instance
let realmInstance: Realm | null = null;

/**
 * Get the Realm instance
 * @returns {Realm} The Realm instance
 */
export function getRealmInstance(): Realm {
  if (realmInstance === null) {
    realmInstance = new Realm({
      schema: [ParcelNoteSchema, SyncQueueSchema],
      schemaVersion: 1,
    });
  }
  return realmInstance;
}

/**
 * Close the Realm instance
 */
export function closeRealm() {
  if (realmInstance !== null) {
    realmInstance.close();
    realmInstance = null;
  }
}

/**
 * Get all parcel notes from Realm
 * @returns Array of parcel notes
 */
export function getAllParcelNotes(): Realm.Results<any> {
  const realm = getRealmInstance();
  return realm.objects('ParcelNote');
}

/**
 * Get a parcel note by ID
 * @param parcelId The parcel ID
 * @returns The parcel note or null if not found
 */
export function getParcelNoteById(parcelId: string): any {
  const realm = getRealmInstance();
  return realm.objectForPrimaryKey('ParcelNote', parcelId);
}

/**
 * Save a parcel note to Realm
 * @param parcelId The parcel ID
 * @param yDocData The Y.Doc data as base64 string
 */
export function saveParcelNote(parcelId: string, yDocData: string): void {
  const realm = getRealmInstance();
  
  realm.write(() => {
    realm.create('ParcelNote', {
      parcelId,
      yDocData,
      updatedAt: new Date(),
    }, Realm.UpdateMode.Modified);
  });
}

/**
 * Delete a parcel note from Realm
 * @param parcelId The parcel ID to delete
 */
export function deleteParcelNote(parcelId: string): void {
  const realm = getRealmInstance();
  const note = realm.objectForPrimaryKey('ParcelNote', parcelId);
  
  if (note) {
    realm.write(() => {
      realm.delete(note);
    });
  }
}

/**
 * Get all queued sync operations
 * @returns Array of sync operations
 */
export function getSyncQueue(): Realm.Results<any> {
  const realm = getRealmInstance();
  return realm.objects('SyncQueue').sorted('timestamp');
}

/**
 * Add an operation to the sync queue
 * @param parcelId The parcel ID
 * @param update The update as base64 string
 */
export function queueSync(parcelId: string, update: string): void {
  const realm = getRealmInstance();
  
  realm.write(() => {
    realm.create('SyncQueue', {
      parcelId,
      update,
      timestamp: new Date(),
    });
  });
}

/**
 * Clear the sync queue
 */
export function clearSyncQueue(): void {
  const realm = getRealmInstance();
  const queue = realm.objects('SyncQueue');
  
  realm.write(() => {
    realm.delete(queue);
  });
}