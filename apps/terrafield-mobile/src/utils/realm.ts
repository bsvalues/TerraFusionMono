import Realm from 'realm';
import { v4 as uuidv4 } from 'uuid';
import Config from '../config';

// Define Realm schemas for our models
const ParcelSchema = {
  name: 'Parcel',
  primaryKey: 'id',
  properties: {
    id: 'string',
    address: 'string',
    city: 'string',
    state: 'string',
    zipCode: 'string',
    acres: 'double',
    assessedValue: 'double',
    ownerName: 'string?',
    latitude: 'double?',
    longitude: 'double?',
    propertyType: 'string?',
    yearBuilt: 'int?',
    lastUpdate: 'date?',
    createdAt: 'date',
    updatedAt: 'date',
    hasNotes: 'bool',
    isDeleted: 'bool',
    serverSynced: 'bool',
    lastSyncedAt: 'date?',
  },
};

const ParcelNoteSchema = {
  name: 'ParcelNote',
  primaryKey: 'id',
  properties: {
    id: 'string',
    parcelId: 'string',
    text: 'string',
    // CRDT state for collaborative editing
    yDocData: 'string?',
    syncCount: { type: 'int', default: 0 },
    createdAt: 'date',
    updatedAt: 'date',
    isDeleted: 'bool',
    serverSynced: 'bool',
    lastSyncedAt: 'date?',
  },
};

const SyncQueueItemSchema = {
  name: 'SyncQueueItem',
  primaryKey: 'id',
  properties: {
    id: 'string',
    endpoint: 'string',
    method: 'string',
    body: 'string', // JSON stringified body
    timestamp: 'date',
    retryCount: 'int',
    isProcessing: 'bool',
  },
};

const UserSchema = {
  name: 'User',
  primaryKey: 'id',
  properties: {
    id: 'int',
    username: 'string',
    email: 'string',
    role: 'string',
    createdAt: 'date',
  },
};

const SettingsSchema = {
  name: 'Settings',
  primaryKey: 'id',
  properties: {
    id: 'string',
    offlineEnabled: 'bool',
    autoSyncEnabled: 'bool',
    backgroundSyncEnabled: 'bool',
    lastSyncTime: 'date?',
  },
};

// Collection of all schemas
const schemas = [
  ParcelSchema,
  ParcelNoteSchema,
  SyncQueueItemSchema,
  UserSchema,
  SettingsSchema,
];

// Singleton instance of Realm
let realmInstance: Realm | null = null;

/**
 * Initialize and get the Realm database instance
 */
export async function getRealm(): Promise<Realm> {
  if (realmInstance && !realmInstance.isClosed) {
    return realmInstance;
  }

  try {
    realmInstance = await Realm.open({
      schema: schemas,
      schemaVersion: 1,
      // Migration function would be defined here for schema updates
      migration: (oldRealm, newRealm) => {
        // Handle migrations as schema evolves
      },
    });

    // Initialize default settings if not exist
    initializeSettings(realmInstance);

    return realmInstance;
  } catch (error) {
    console.error('Failed to open Realm database:', error);
    throw error;
  }
}

/**
 * Initialize default settings if not already present
 */
function initializeSettings(realm: Realm): void {
  const settings = realm.objects('Settings').filtered('id = "app-settings"')[0];

  if (!settings) {
    realm.write(() => {
      realm.create('Settings', {
        id: 'app-settings',
        offlineEnabled: true,
        autoSyncEnabled: true,
        backgroundSyncEnabled: false,
        lastSyncTime: null,
      });
    });
  }
}

/**
 * Generate a new UUID for Realm objects
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Close the Realm instance
 */
export function closeRealm(): void {
  if (realmInstance && !realmInstance.isClosed) {
    realmInstance.close();
    realmInstance = null;
  }
}

/**
 * Parcel repository - functions for working with parcels
 */
export const ParcelRepository = {
  /**
   * Get all parcels (non-deleted)
   */
  async getAll(): Promise<any[]> {
    const realm = await getRealm();
    const parcels = realm.objects('Parcel').filtered('isDeleted = false');
    return Array.from(parcels);
  },

  /**
   * Get a single parcel by ID
   */
  async getById(id: string): Promise<any | null> {
    const realm = await getRealm();
    const parcel = realm.objectForPrimaryKey('Parcel', id);
    return parcel || null;
  },

  /**
   * Create a new parcel
   */
  async create(parcelData: any): Promise<any> {
    const realm = await getRealm();
    let newParcel;

    realm.write(() => {
      newParcel = realm.create('Parcel', {
        id: generateId(),
        ...parcelData,
        createdAt: new Date(),
        updatedAt: new Date(),
        hasNotes: false,
        isDeleted: false,
        serverSynced: false,
        lastSyncedAt: null,
      });
    });

    return newParcel;
  },

  /**
   * Update an existing parcel
   */
  async update(id: string, updates: any): Promise<any | null> {
    const realm = await getRealm();
    const parcel = realm.objectForPrimaryKey('Parcel', id);

    if (!parcel) {
      return null;
    }

    realm.write(() => {
      Object.assign(parcel, {
        ...updates,
        updatedAt: new Date(),
        serverSynced: false,
      });
    });

    return parcel;
  },

  /**
   * Soft delete a parcel
   */
  async delete(id: string): Promise<boolean> {
    const realm = await getRealm();
    const parcel = realm.objectForPrimaryKey('Parcel', id);

    if (!parcel) {
      return false;
    }

    realm.write(() => {
      Object.assign(parcel, {
        isDeleted: true,
        updatedAt: new Date(),
        serverSynced: false,
      });
    });

    return true;
  },

  /**
   * Mark a parcel as synced with server
   */
  async markSynced(id: string): Promise<void> {
    const realm = await getRealm();
    const parcel = realm.objectForPrimaryKey('Parcel', id);

    if (parcel) {
      realm.write(() => {
        Object.assign(parcel, {
          serverSynced: true,
          lastSyncedAt: new Date(),
        });
      });
    }
  },
};

/**
 * ParcelNote repository - functions for working with parcel notes
 */
export const ParcelNoteRepository = {
  /**
   * Get a note by parcel ID
   */
  async getByParcelId(parcelId: string): Promise<any | null> {
    const realm = await getRealm();
    const notes = realm.objects('ParcelNote')
      .filtered('parcelId = $0 AND isDeleted = false', parcelId);
    
    return notes.length > 0 ? notes[0] : null;
  },

  /**
   * Create a new note
   */
  async create(noteData: any): Promise<any> {
    const realm = await getRealm();
    let newNote;

    realm.write(() => {
      newNote = realm.create('ParcelNote', {
        id: generateId(),
        ...noteData,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        serverSynced: false,
        lastSyncedAt: null,
      });

      // Update the associated parcel to indicate it has notes
      const parcel = realm.objectForPrimaryKey('Parcel', noteData.parcelId);
      if (parcel) {
        parcel.hasNotes = true;
        parcel.serverSynced = false;
        parcel.updatedAt = new Date();
      }
    });

    return newNote;
  },

  /**
   * Update an existing note
   */
  async update(id: string, updates: any): Promise<any | null> {
    const realm = await getRealm();
    const note = realm.objectForPrimaryKey('ParcelNote', id);

    if (!note) {
      return null;
    }

    realm.write(() => {
      Object.assign(note, {
        ...updates,
        updatedAt: new Date(),
        serverSynced: false,
      });
    });

    return note;
  },

  /**
   * Delete a note
   */
  async delete(id: string): Promise<boolean> {
    const realm = await getRealm();
    const note = realm.objectForPrimaryKey('ParcelNote', id);

    if (!note) {
      return false;
    }

    realm.write(() => {
      Object.assign(note, {
        isDeleted: true,
        updatedAt: new Date(),
        serverSynced: false,
      });

      // Check if there are any other notes for this parcel
      const parcelId = note.parcelId;
      const remainingNotes = realm.objects('ParcelNote')
        .filtered('parcelId = $0 AND isDeleted = false AND id != $1', parcelId, id);
      
      // If no remaining notes, update the parcel
      if (remainingNotes.length === 0) {
        const parcel = realm.objectForPrimaryKey('Parcel', parcelId);
        if (parcel) {
          parcel.hasNotes = false;
          parcel.serverSynced = false;
          parcel.updatedAt = new Date();
        }
      }
    });

    return true;
  },

  /**
   * Mark a note as synced with server
   */
  async markSynced(id: string): Promise<void> {
    const realm = await getRealm();
    const note = realm.objectForPrimaryKey('ParcelNote', id);

    if (note) {
      realm.write(() => {
        Object.assign(note, {
          serverSynced: true,
          lastSyncedAt: new Date(),
        });
      });
    }
  },
};

/**
 * SyncQueue repository - functions for working with sync queue
 */
export const SyncQueueRepository = {
  /**
   * Get all items in the sync queue
   */
  async getAll(): Promise<any[]> {
    const realm = await getRealm();
    const items = realm.objects('SyncQueueItem');
    return Array.from(items);
  },

  /**
   * Add an item to the sync queue
   */
  async add(item: {
    endpoint: string;
    method: string;
    body: any;
  }): Promise<any> {
    const realm = await getRealm();
    let newItem;

    realm.write(() => {
      newItem = realm.create('SyncQueueItem', {
        id: generateId(),
        endpoint: item.endpoint,
        method: item.method,
        body: JSON.stringify(item.body),
        timestamp: new Date(),
        retryCount: 0,
        isProcessing: false,
      });
    });

    return newItem;
  },

  /**
   * Remove an item from the sync queue
   */
  async remove(id: string): Promise<boolean> {
    const realm = await getRealm();
    const item = realm.objectForPrimaryKey('SyncQueueItem', id);

    if (!item) {
      return false;
    }

    realm.write(() => {
      realm.delete(item);
    });

    return true;
  },

  /**
   * Mark an item as processing
   */
  async markProcessing(id: string, isProcessing: boolean): Promise<boolean> {
    const realm = await getRealm();
    const item = realm.objectForPrimaryKey('SyncQueueItem', id);

    if (!item) {
      return false;
    }

    realm.write(() => {
      item.isProcessing = isProcessing;
    });

    return true;
  },

  /**
   * Increment retry count for an item
   */
  async incrementRetryCount(id: string): Promise<boolean> {
    const realm = await getRealm();
    const item = realm.objectForPrimaryKey('SyncQueueItem', id);

    if (!item) {
      return false;
    }

    realm.write(() => {
      item.retryCount += 1;
    });

    return true;
  },

  /**
   * Clear all items from the sync queue
   */
  async clearAll(): Promise<void> {
    const realm = await getRealm();
    const items = realm.objects('SyncQueueItem');

    realm.write(() => {
      realm.delete(items);
    });
  },
};

/**
 * Settings repository - functions for working with app settings
 */
export const SettingsRepository = {
  /**
   * Get all settings
   */
  async getSettings(): Promise<any | null> {
    const realm = await getRealm();
    const settings = realm.objects('Settings').filtered('id = "app-settings"')[0];
    return settings || null;
  },

  /**
   * Update settings
   */
  async updateSettings(updates: any): Promise<any | null> {
    const realm = await getRealm();
    const settings = realm.objects('Settings').filtered('id = "app-settings"')[0];

    if (!settings) {
      return null;
    }

    realm.write(() => {
      Object.assign(settings, updates);
    });

    return settings;
  },

  /**
   * Update last sync time
   */
  async updateLastSyncTime(time: Date): Promise<void> {
    const realm = await getRealm();
    const settings = realm.objects('Settings').filtered('id = "app-settings"')[0];

    if (settings) {
      realm.write(() => {
        settings.lastSyncTime = time;
      });
    }
  },
};

export default {
  getRealm,
  closeRealm,
  generateId,
  ParcelRepository,
  ParcelNoteRepository,
  SyncQueueRepository,
  SettingsRepository,
};