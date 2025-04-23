import Realm from 'realm';

/**
 * Schema for parcels
 */
export const ParcelSchema = {
  name: 'Parcel',
  primaryKey: 'id',
  properties: {
    id: 'string',
    name: 'string',
    geometry: 'string?', // GeoJSON as string
    address: 'string?',
    city: 'string?',
    state: 'string?',
    zipCode: 'string?',
    county: 'string?',
    owner: 'string?',
    acreage: 'double?',
    zoning: 'string?',
    notes: 'string?',
    // CRDT sync fields
    localUpdate: 'string?', // Base64 encoded CRDT update
    remoteUpdate: 'string?', // Base64 encoded CRDT update from server
    lastSynced: 'date?',
    syncStatus: 'string?', // 'synced', 'pending', 'conflict'
    // Metadata
    createdAt: 'date',
    updatedAt: 'date',
    lastViewed: 'date?'
  }
};

/**
 * Schema for parcel notes
 */
export const ParcelNoteSchema = {
  name: 'ParcelNote',
  primaryKey: 'id',
  properties: {
    id: 'string',
    parcelId: 'string',
    content: 'string',
    lastEdited: 'date',
    createdBy: 'string?',
    // Sync status
    syncStatus: 'string', // 'synced', 'pending', 'conflict'
    // Metadata
    createdAt: 'date',
    updatedAt: 'date'
  }
};

/**
 * Schema for sync queue items
 */
export const SyncQueueItemSchema = {
  name: 'SyncQueueItem',
  primaryKey: 'id',
  properties: {
    id: 'string',
    parcelId: 'string',
    update: 'string',
    timestamp: 'date',
    retryCount: 'int',
    status: 'string', // 'pending', 'processing', 'failed', 'completed'
    statusMessage: 'string?'
  }
};

/**
 * Schema for user data
 */
export const UserDataSchema = {
  name: 'UserData',
  primaryKey: 'id',
  properties: {
    id: 'string',
    username: 'string',
    email: 'string?',
    role: 'string?',
    // Preferences
    theme: 'string?', // 'light', 'dark', 'system'
    syncInterval: 'int?', // in milliseconds
    maxOfflineStorage: 'int?', // in bytes
    // Sync data
    lastSync: 'date?'
  }
};

/**
 * Schema for offline map tiles
 */
export const MapTileSchema = {
  name: 'MapTile',
  primaryKey: 'id',
  properties: {
    id: 'string', // URL hash or other unique identifier
    url: 'string',
    data: 'data', // Binary tile data
    z: 'int', // Zoom level
    x: 'int', // X coordinate
    y: 'int', // Y coordinate
    // Metadata
    createdAt: 'date',
    lastAccessed: 'date'
  }
};

/**
 * Schema for parcel media (photos, files)
 */
export const ParcelMediaSchema = {
  name: 'ParcelMedia',
  primaryKey: 'id',
  properties: {
    id: 'string',
    parcelId: 'string',
    type: 'string', // 'photo', 'document', etc.
    uri: 'string', // Local file URI
    remoteUri: 'string?', // Server URI if uploaded
    name: 'string',
    size: 'int?', // Size in bytes
    mimeType: 'string?',
    // Metadata for photos
    latitude: 'double?',
    longitude: 'double?',
    timestamp: 'date?',
    // Sync status
    syncStatus: 'string', // 'synced', 'pending', 'conflict'
    // Metadata
    createdAt: 'date',
    updatedAt: 'date'
  }
};

/**
 * Singleton provider for Realm instance
 */
class RealmDBProvider {
  private realm: Realm | null = null;
  private schemas = [
    ParcelSchema,
    ParcelNoteSchema,
    SyncQueueItemSchema,
    UserDataSchema,
    MapTileSchema,
    ParcelMediaSchema
  ];

  /**
   * Open or get the Realm instance
   */
  public async getRealm(): Promise<Realm> {
    if (this.realm && !this.realm.isClosed) {
      return this.realm;
    }

    try {
      this.realm = await Realm.open({
        schema: this.schemas,
        schemaVersion: 1,
      });
      return this.realm;
    } catch (error) {
      console.error('Failed to open Realm:', error);
      throw error;
    }
  }

  /**
   * Close the Realm instance if open
   */
  public closeRealm(): void {
    if (this.realm && !this.realm.isClosed) {
      this.realm.close();
      this.realm = null;
    }
  }

  /**
   * Delete all data in the Realm database
   */
  public async clearDatabase(): Promise<void> {
    try {
      const realm = await this.getRealm();
      realm.write(() => {
        realm.deleteAll();
      });
    } catch (error) {
      console.error('Failed to clear database:', error);
      throw error;
    }
  }

  /**
   * Get the file path to the Realm database file
   */
  public async getRealmPath(): Promise<string> {
    const realm = await this.getRealm();
    return realm.path;
  }
}

// Create singleton provider instance
export const RealmProvider = new RealmDBProvider();