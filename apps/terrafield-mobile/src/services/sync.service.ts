import Realm from 'realm';
import { apiService } from './api.service';
import { authService } from './auth.service';
import { networkService } from './network.service';
import { appConfig } from '../config';
import * as Y from 'yjs';
import {
  createParcelStore,
  applyEncodedUpdate,
  encodeDocUpdate,
} from '@terrafusion/crdt';
import { ParcelSchema, SyncQueueItemSchema, RealmProvider } from '../utils/realm';

// Types
export interface SyncQueueItem {
  id: string;
  parcelId: string;
  update: string;
  timestamp: Date;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  statusMessage?: string;
}

export interface SyncResult {
  success: boolean;
  message?: string;
  totalSynced?: number;
  errors?: Array<{ parcelId: string; message: string }>;
}

export interface SyncState {
  isSyncing: boolean;
  lastSynced: Date | null;
  syncProgress: number;
  error: string | null;
}

class SyncService {
  private syncInterval: any = null;
  private isInitialized: boolean = false;
  private syncQueue: Realm.Results<Realm> | null = null;
  private state: SyncState = {
    isSyncing: false,
    lastSynced: null,
    syncProgress: 0,
    error: null,
  };
  private stateListeners: ((state: SyncState) => void)[] = [];
  private realmInstance: Realm | null = null;

  constructor() {
    // Listen for network changes to trigger sync when connection restored
    networkService.addListener(this.handleNetworkChange);
  }

  /**
   * Initialize the sync service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Get realm instance
      this.realmInstance = await RealmProvider.getRealm();
      
      // Get sync queue
      this.syncQueue = this.realmInstance.objects<Realm>(SyncQueueItemSchema.name)
        .sorted('timestamp');

      // Set up periodic sync based on config
      this.startSyncInterval();
      
      this.isInitialized = true;
      
      // Trigger initial sync
      this.syncIfOnline();
    } catch (error: any) {
      console.error('Failed to initialize sync service:', error);
    }
  }

  /**
   * Start the sync interval timer
   */
  private startSyncInterval() {
    // Clear any existing interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Set up new interval
    this.syncInterval = setInterval(() => {
      this.syncIfOnline();
    }, appConfig.sync.interval);
  }

  /**
   * Handle network status changes
   */
  private handleNetworkChange = (isOnline: boolean) => {
    // If we're back online and have pending items, sync
    if (isOnline && this.hasPendingSync()) {
      this.syncIfOnline();
    }
  };

  /**
   * Subscribe to sync state changes
   */
  public subscribe(listener: (state: SyncState) => void): () => void {
    this.stateListeners.push(listener);
    
    // Immediately notify listener of current state
    listener({ ...this.state });
    
    // Return unsubscribe function
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== listener);
    };
  }

  /**
   * Update the sync state and notify listeners
   */
  private setState(updates: Partial<SyncState>) {
    this.state = { ...this.state, ...updates };
    
    // Notify all listeners
    this.stateListeners.forEach(listener => {
      try {
        listener({ ...this.state });
      } catch (error) {
        console.error('Error in sync state listener:', error);
      }
    });
  }

  /**
   * Add a document update to the sync queue
   */
  public async queueSync(parcelId: string, docUpdate: string): Promise<void> {
    if (!this.realmInstance) {
      throw new Error('Sync service not initialized');
    }

    try {
      // Add to sync queue
      this.realmInstance.write(() => {
        this.realmInstance!.create(SyncQueueItemSchema.name, {
          id: new Realm.BSON.UUID().toHexString(),
          parcelId,
          update: docUpdate,
          timestamp: new Date(),
          retryCount: 0,
          status: 'pending',
        });
      });
      
      // Try to sync immediately if online
      this.syncIfOnline();
    } catch (error: any) {
      console.error('Failed to queue sync:', error);
      throw error;
    }
  }

  /**
   * Check if there are pending sync items
   */
  private hasPendingSync(): boolean {
    if (!this.syncQueue) return false;
    
    return this.syncQueue.filtered('status = "pending" OR status = "failed"').length > 0;
  }

  /**
   * Sync if we have network connection
   */
  private syncIfOnline(): void {
    // Only sync if online and not already syncing
    if (networkService.isOnline() && !this.state.isSyncing && this.hasPendingSync()) {
      this.sync();
    }
  }

  /**
   * Process the sync queue
   */
  public async sync(): Promise<SyncResult> {
    // If not initialized or already syncing, return
    if (!this.isInitialized || this.state.isSyncing || !this.realmInstance) {
      return { success: false, message: 'Sync service busy or not initialized' };
    }
    
    // Check authentication
    if (!authService.isAuthenticated()) {
      return { success: false, message: 'User not authenticated' };
    }
    
    // Set syncing state
    this.setState({ 
      isSyncing: true, 
      syncProgress: 0,
      error: null 
    });
    
    const result: SyncResult = {
      success: true,
      totalSynced: 0,
      errors: []
    };
    
    try {
      // Get pending items
      const pendingItems = this.syncQueue?.filtered('status = "pending" OR status = "failed"');
      
      if (!pendingItems || pendingItems.length === 0) {
        // Nothing to sync
        this.setState({ 
          isSyncing: false, 
          syncProgress: 100,
          lastSynced: new Date()
        });
        return { success: true, totalSynced: 0 };
      }
      
      // Calculate total items
      const totalItems = pendingItems.length;
      let processedItems = 0;
      
      // Process each pending item
      for (let i = 0; i < pendingItems.length; i++) {
        const item = pendingItems[i];
        
        // Mark as processing
        this.realmInstance.write(() => {
          (item as any).status = 'processing';
        });
        
        try {
          // Send the update to the server
          await apiService.syncData({
            parcelId: (item as any).parcelId,
            update: (item as any).update,
            timestamp: (item as any).timestamp
          });
          
          // Mark as completed
          this.realmInstance.write(() => {
            (item as any).status = 'completed';
          });
          
          // Increment synced count
          (result.totalSynced as number) += 1;
        } catch (error: any) {
          // Handle error
          const errorMessage = error.message || 'Sync failed';
          
          // Add to errors
          result.errors?.push({
            parcelId: (item as any).parcelId,
            message: errorMessage
          });
          
          // Increment retry count and update status
          this.realmInstance.write(() => {
            (item as any).retryCount += 1;
            (item as any).status = 'failed';
            (item as any).statusMessage = errorMessage;
          });
          
          // Log error
          console.error(`Sync failed for parcel ${(item as any).parcelId}:`, error);
        }
        
        // Update progress
        processedItems++;
        this.setState({ 
          syncProgress: Math.floor((processedItems / totalItems) * 100) 
        });
      }
      
      // Update result success state
      result.success = (result.errors?.length || 0) === 0;
      
      // Clean up completed items older than 7 days
      this.cleanupCompletedItems();
      
      // Update last synced time
      this.setState({ 
        isSyncing: false, 
        lastSynced: new Date(),
        error: result.success ? null : `Failed to sync ${result.errors?.length} items`
      });
      
      return result;
    } catch (error: any) {
      // Handle global error
      this.setState({ 
        isSyncing: false, 
        error: `Sync failed: ${error.message || 'Unknown error'}`
      });
      
      return {
        success: false,
        message: error.message || 'Sync failed'
      };
    }
  }

  /**
   * Download and apply remote updates for a parcel
   */
  public async fetchRemoteUpdates(parcelId: string): Promise<boolean> {
    if (!this.isInitialized || !this.realmInstance) {
      throw new Error('Sync service not initialized');
    }

    try {
      // Fetch remote updates
      const response = await apiService.get(`/api/mobile/parcels/${parcelId}/updates`);
      
      if (!response.update) {
        return false;
      }
      
      // Get the parcel from Realm
      const parcel = this.realmInstance.objectForPrimaryKey(
        ParcelSchema.name, 
        parcelId
      );
      
      if (!parcel) {
        console.error(`Parcel ${parcelId} not found in local database`);
        return false;
      }
      
      // Create a Y.Doc with the current state
      const { doc } = createParcelStore(parcelId);
      
      // Apply local update if it exists
      if ((parcel as any).localUpdate) {
        applyEncodedUpdate(doc, (parcel as any).localUpdate);
      }
      
      // Apply remote update
      applyEncodedUpdate(doc, response.update);
      
      // Get the merged update
      const mergedUpdate = encodeDocUpdate(doc);
      
      // Save the merged update to Realm
      this.realmInstance.write(() => {
        (parcel as any).lastSynced = new Date();
        (parcel as any).localUpdate = mergedUpdate;
        (parcel as any).remoteUpdate = response.update;
      });
      
      return true;
    } catch (error: any) {
      console.error(`Failed to fetch remote updates for parcel ${parcelId}:`, error);
      return false;
    }
  }

  /**
   * Clean up completed sync items older than 7 days
   */
  private cleanupCompletedItems() {
    if (!this.realmInstance) return;
    
    try {
      // Get completed items older than 7 days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      
      const oldItems = this.realmInstance.objects(SyncQueueItemSchema.name)
        .filtered('status = "completed" AND timestamp < $0', cutoffDate);
      
      // Delete old items
      if (oldItems.length > 0) {
        this.realmInstance.write(() => {
          this.realmInstance!.delete(oldItems);
        });
      }
    } catch (error) {
      console.error('Failed to clean up completed sync items:', error);
    }
  }

  /**
   * Force a manual sync
   */
  public async manualSync(): Promise<SyncResult> {
    return this.sync();
  }

  /**
   * Get the current sync state
   */
  public getSyncState(): SyncState {
    return { ...this.state };
  }

  /**
   * Clean up resources
   */
  public destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Clear listeners
    this.stateListeners = [];
  }
}

// Create singleton instance
export const syncService = new SyncService();