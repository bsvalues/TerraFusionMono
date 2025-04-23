import { useState, useEffect } from 'react';
import { createParcelStore, encodeDocUpdate, applyEncodedUpdate } from '@terrafusion/crdt';
import { getRealmInstance } from '../utils/realm';
import { syncService } from '../services/sync.service';

export function useParcelNote(parcelId: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  
  // Create CRDT store
  const { store, doc } = createParcelStore(parcelId);
  
  // Load data from local storage
  useEffect(() => {
    const loadFromRealm = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const realm = getRealmInstance();
        const note = realm.objectForPrimaryKey('ParcelNote', parcelId);
        
        if (note && note.yDocData) {
          // Apply stored updates to the doc
          applyEncodedUpdate(doc, note.yDocData);
          setLastSynced(note.updatedAt);
        }
        
        realm.close();
      } catch (loadError) {
        setError(`Failed to load note: ${loadError.message}`);
        console.error('Load error:', loadError);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFromRealm();
  }, [parcelId, doc]);
  
  // Save changes to Realm
  const saveChanges = async () => {
    try {
      const encodedUpdate = encodeDocUpdate(doc);
      const realm = getRealmInstance();
      
      realm.write(() => {
        realm.create('ParcelNote', {
          parcelId,
          yDocData: encodedUpdate,
          updatedAt: new Date(),
        }, Realm.UpdateMode.Modified);
      });
      
      realm.close();
    } catch (saveError) {
      console.error('Save error:', saveError);
      setError(`Failed to save note: ${saveError.message}`);
    }
  };
  
  // Sync with server
  const syncWithServer = async () => {
    setIsSyncing(true);
    setError(null);
    
    try {
      const encodedUpdate = encodeDocUpdate(doc);
      
      // Queue sync operation
      syncService.queueSync(parcelId, encodedUpdate);
      
      // Save locally
      await saveChanges();
      
      // Force immediate sync
      await syncService.forceSyncAll();
      
      setLastSynced(new Date());
    } catch (syncError) {
      setError(`Sync failed: ${syncError.message}`);
      console.error('Sync error:', syncError);
    } finally {
      setIsSyncing(false);
    }
  };
  
  return {
    note: store.notes,
    setNote: (content: string) => {
      store.notes = content;
      saveChanges();
    },
    isLoading,
    isSyncing,
    error,
    lastSynced,
    sync: syncWithServer,
  };
}