import { BehaviorSubject } from 'rxjs';
import Config from '../config';
import apiService from './api.service';
import networkService from './network.service';
import { SettingsRepository, SyncQueueRepository } from '../utils/realm';

interface SyncState {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingChanges: number;
  autoSyncEnabled: boolean;
  backgroundSyncEnabled: boolean;
}

/**
 * Synchronization service for handling offline/online data sync
 */
class SyncService {
  private _syncState = new BehaviorSubject<SyncState>({
    isSyncing: false,
    lastSyncTime: null,
    pendingChanges: 0,
    autoSyncEnabled: true,
    backgroundSyncEnabled: false
  });
  
  private syncInterval: any = null;
  private lastSyncAttempt: Date | null = null;
  private _isInitialized = false;
  
  /**
   * Initialize the sync service
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) {
      return;
    }
    
    try {
      // Load settings from the database
      const settings = await SettingsRepository.getSettings();
      
      if (settings) {
        // Update sync state with settings
        this._syncState.next({
          ...this._syncState.value,
          lastSyncTime: settings.lastSyncTime,
          autoSyncEnabled: settings.autoSyncEnabled,
          backgroundSyncEnabled: settings.backgroundSyncEnabled
        });
      }
      
      // Get current pending changes count
      const syncQueue = await apiService.getSyncQueue();
      this._syncState.next({
        ...this._syncState.value,
        pendingChanges: syncQueue.length
      });
      
      // Set up periodic sync if auto-sync is enabled
      if (this._syncState.value.autoSyncEnabled) {
        this.setupAutoSync();
      }
      
      this._isInitialized = true;
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
  public async getLastSyncTime(): Promise<Date | null> {
    const settings = await SettingsRepository.getSettings();
    return settings?.lastSyncTime || null;
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
      
      // Get updated pending changes count
      const updatedSyncQueue = await apiService.getSyncQueue();
      const remainingChanges = updatedSyncQueue.length;
      
      // Update sync state
      const now = new Date();
      this._syncState.next({
        ...this._syncState.value,
        isSyncing: false,
        lastSyncTime: success ? now : this._syncState.value.lastSyncTime,
        pendingChanges: remainingChanges
      });
      
      // Save last sync time if successful
      if (success && pendingChanges > 0) {
        await SettingsRepository.updateLastSyncTime(now);
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
   * Enable or disable auto sync
   */
  public async setAutoSync(enabled: boolean): Promise<void> {
    // Update settings in database
    const settings = await SettingsRepository.updateSettings({
      autoSyncEnabled: enabled
    });
    
    // Update sync state
    this._syncState.next({
      ...this._syncState.value,
      autoSyncEnabled: enabled
    });
    
    // Setup or clear the sync interval
    if (enabled) {
      this.setupAutoSync();
    } else {
      this.clearAutoSync();
    }
  }
  
  /**
   * Enable or disable background sync
   */
  public async setBackgroundSync(enabled: boolean): Promise<void> {
    // Update settings in database
    const settings = await SettingsRepository.updateSettings({
      backgroundSyncEnabled: enabled
    });
    
    // Update sync state
    this._syncState.next({
      ...this._syncState.value,
      backgroundSyncEnabled: enabled
    });
  }
  
  /**
   * Setup automatic synchronization
   */
  private setupAutoSync(): void {
    // Clear any existing interval
    this.clearAutoSync();
    
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
   * Clear the automatic synchronization interval
   */
  private clearAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
  
  /**
   * Reset sync state (e.g. after logout)
   */
  public reset(): void {
    // Clear auto-sync interval
    this.clearAutoSync();
    
    // Reset sync state
    this._syncState.next({
      isSyncing: false,
      lastSyncTime: null,
      pendingChanges: 0,
      autoSyncEnabled: true,
      backgroundSyncEnabled: false
    });
  }
  
  /**
   * Reset all sync data
   * This is useful when the user wants to clear all offline data
   */
  public async resetSyncData(): Promise<void> {
    try {
      // Clear all sync queue items
      await SyncQueueRepository.clearAll();
      
      // Update sync state
      this._syncState.next({
        ...this._syncState.value,
        pendingChanges: 0
      });
    } catch (error) {
      console.error('Error resetting sync data:', error);
      throw error;
    }
  }
}

const syncService = new SyncService();
export default syncService;