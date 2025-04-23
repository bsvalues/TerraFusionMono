import Realm from 'realm';
import { apiService, SyncRequest } from './api.service';
import { getRealmInstance } from '../utils/realm';

interface QueuedSync {
  parcelId: string;
  update: string;
  timestamp: Date;
}

class SyncService {
  private syncQueue: QueuedSync[] = [];
  private isOnline: boolean = true;
  private isProcessing: boolean = false;
  
  constructor() {
    // Load any queued syncs from persistent storage
    this.loadQueue();
    
    // In a real app, add network listeners to detect connectivity changes
  }
  
  /**
   * Load queued syncs from storage
   */
  private loadQueue() {
    try {
      const realm = getRealmInstance();
      const queuedSyncs = realm.objects('SyncQueue').sorted('timestamp');
      
      this.syncQueue = Array.from(queuedSyncs).map(item => ({
        parcelId: item.parcelId,
        update: item.update,
        timestamp: item.timestamp,
      }));
      
      realm.close();
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }
  
  /**
   * Save the queue to persistent storage
   */
  private saveQueue() {
    try {
      const realm = getRealmInstance();
      
      realm.write(() => {
        // Clear existing queue
        const existingQueue = realm.objects('SyncQueue');
        realm.delete(existingQueue);
        
        // Add current queue items
        this.syncQueue.forEach(item => {
          realm.create('SyncQueue', {
            parcelId: item.parcelId,
            update: item.update,
            timestamp: item.timestamp,
          });
        });
      });
      
      realm.close();
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }
  
  /**
   * Queue a sync operation
   */
  queueSync(parcelId: string, update: string) {
    this.syncQueue.push({
      parcelId,
      update,
      timestamp: new Date(),
    });
    
    this.saveQueue();
    
    // Try to process the queue immediately if we're online
    if (this.isOnline) {
      this.processQueue();
    }
  }
  
  /**
   * Process the sync queue
   */
  async processQueue() {
    if (this.isProcessing || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      // Process queue in order
      while (this.syncQueue.length > 0 && this.isOnline) {
        const item = this.syncQueue[0];
        
        await this.syncItem(item);
        
        // Remove the processed item
        this.syncQueue.shift();
        this.saveQueue();
      }
    } catch (error) {
      console.error('Error processing sync queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }
  
  /**
   * Sync a single item
   */
  private async syncItem(item: QueuedSync) {
    try {
      const req: SyncRequest = {
        parcelId: item.parcelId,
        update: item.update,
      };
      
      const response = await apiService.syncParcelNote(req);
      
      // Update local storage with merged state
      const realm = getRealmInstance();
      realm.write(() => {
        realm.create('ParcelNote', {
          parcelId: item.parcelId,
          yDocData: response.update,
          updatedAt: new Date(),
        }, Realm.UpdateMode.Modified);
      });
      realm.close();
      
      return true;
    } catch (error) {
      console.error(`Failed to sync parcel ${item.parcelId}:`, error);
      
      // If it's a network error, set offline mode
      // if (error instanceof NetworkError) {
      //   this.isOnline = false;
      // }
      
      throw error;
    }
  }
  
  /**
   * Manually trigger sync process
   */
  async forceSyncAll() {
    this.isOnline = true; // Assume we're online for a manual sync
    return this.processQueue();
  }
  
  /**
   * Set online status
   */
  setOnlineStatus(isOnline: boolean) {
    this.isOnline = isOnline;
    
    if (isOnline) {
      this.processQueue();
    }
  }
}

export const syncService = new SyncService();