import Realm from 'realm';

const ParcelNoteSchema = {
  name: 'ParcelNote',
  primaryKey: 'parcelId',
  properties: {
    parcelId: 'string',
    yDocData: 'string', // Base64 encoded Y.Doc update
    updatedAt: 'date',
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

export const getRealmInstance = () => {
  return new Realm({
    schema: [ParcelNoteSchema, SyncQueueSchema],
    schemaVersion: 1,
  });
};