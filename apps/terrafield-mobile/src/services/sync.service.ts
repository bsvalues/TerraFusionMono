import { BehaviorSubject } from 'rxjs';
import Config from '../config';
import apiService from './api.service';
import networkService from './network.service';

interface SyncState {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
}

/**
 * Synchronization service for handling offline/online data sync
 */
class SyncService {
  private _syncState = new BehaviorSubject<SyncState>({
    isSyncing: false,
    lastSyncTime: null,
    pendingChanges: 0
  });
  
  private syncInterval: any = null;
  private lastSyncAttempt: Date | null = null;
  
  /**
   * Initialize the sync service
   */
  public async initialize(): Promise<void> {
    try {
      // Load the last sync time
      const lastSyncTimeStr = await this.loadLastSyncTime();
      if (lastSyncTimeStr) {
        const lastSyncTime = new Date(lastSyncTimeStr);
        this._syncState.next({
          ...this._syncState.value,
          lastSyncTime
        });
      }
      
      // Set up periodic sync if auto-sync is enabled
      this.setupAutoSync();
      
    } catch (error) {
      console.error('Error initializing sync service:', error);
    }
  }
  
  /**
   * Observable for sync state changes
   */
  public get syncState$() {
    return this._syncState.asObservable();
  }
  
  /**
   * Get the last synchronization time
   */
  public async getLastSyncTime(): Promise<string | null> {
    return this.loadLastSyncTime();
  }
  
  /**
   * Perform a synchronization
   */
  public async performSync(): Promise<boolean> {
    if (this._syncState.value.isSyncing) {
      return false; // Already syncing
    }
    
    if (!networkService.isOnline()) {
      return false; // Offline, can't sync
    }
    
    try {
      // Update sync state
      this._syncState.next({
        ...this._syncState.value,
        isSyncing: true
      });
      
      this.lastSyncAttempt = new Date();
      
      // Get pending changes count
      const syncQueue = await apiService.getSyncQueue();
      const pendingChanges = syncQueue.length;
      
      // Process the sync queue
      const success = await apiService.processSyncQueue();
      
      // Update sync state
      const now = new Date();
      this._syncState.next({
        isSyncing: false,
        lastSyncTime: success ? now : this._syncState.value.lastSyncTime,
        pendingChanges: success ? 0 : pendingChanges
      });
      
      // Save last sync time if successful
      if (success) {
        await this.saveLastSyncTime(now.toISOString());
      }
      
      return success;
    } catch (error) {
      console.error('Sync error:', error);
      
      // Update sync state to show error
      this._syncState.next({
        ...this._syncState.value,
        isSyncing: false
      });
      
      return false;
    }
  }
  
  /**
   * Setup automatic synchronization
   */
  private setupAutoSync(): void {
    // Clear any existing interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Set up new interval
    this.syncInterval = setInterval(async () => {
      // Only sync if online and not already syncing
      if (networkService.isOnline() && !this._syncState.value.isSyncing) {
        // Check if we have pending changes
        const syncQueue = await apiService.getSyncQueue();
        if (syncQueue.length > 0) {
          await this.performSync();
        }
      }
    }, Config.SYNC.SYNC_INTERVAL);
  }
  
  /**
   * Save the last sync time to persistent storage
   */
  private async saveLastSyncTime(time: string): Promise<void> {
    // In a real implementation, this would save to AsyncStorage or similar
    // For now, we'll just log that it would be saved
    console.log(`Would save last sync time: ${time}`);
  }
  
  /**
   * Load the last sync time from persistent storage
   */
  private async loadLastSyncTime(): Promise<string | null> {
    // In a real implementation, this would load from AsyncStorage or similar
    // For now, we'll return null (never synced)
    return null;
  }
  
  /**
   * Reset sync state (e.g. after logout)
   */
  public reset(): void {
    // Clear auto-sync interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    // Reset sync state
    this._syncState.next({
      isSyncing: false,
      lastSyncTime: null,
      pendingChanges: 0
    });
  }
}

const syncService = new SyncService();
export default syncService;