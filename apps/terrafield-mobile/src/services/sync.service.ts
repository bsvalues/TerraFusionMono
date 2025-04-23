import Realm from 'realm';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { NetworkService } from './network.service';
import Config from '../config';

// Sync state tracker
const syncState = {
  lastSyncTime: null as Date | null,
  isSyncing: false,
  syncErrors: [] as string[],
  syncQueue: [] as { parcelId: string, update: string, timestamp: Date }[]
};

// Background sync interval ID
let syncIntervalId: NodeJS.Timeout | null = null;

/**
 * Initialize sync service
 */
export function initSyncService() {
  // Set up listeners for network changes
  NetworkService.addListener(isConnected => {
    if (isConnected && syncState.syncQueue.length > 0) {
      processSyncQueue();
    }
  });
  
  // Start background sync
  startBackgroundSync();
  
  // Return cleanup function
  return () => {
    stopBackgroundSync();
  };
}

/**
 * Start background sync
 */
function startBackgroundSync() {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
  }
  
  syncIntervalId = setInterval(() => {
    if (NetworkService.isConnected() && !syncState.isSyncing) {
      syncAll();
    }
  }, Config.SYNC.SYNC_INTERVAL);
}

/**
 * Stop background sync
 */
function stopBackgroundSync() {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
}

/**
 * Sync a specific parcel's updates
 */
export async function syncParcel(parcelId: string, update: string): Promise<boolean> {
  try {
    if (!NetworkService.isConnected()) {
      // Add to queue for later sync
      syncState.syncQueue.push({
        parcelId,
        update,
        timestamp: new Date()
      });
      return false;
    }
    
    syncState.isSyncing = true;
    
    // Check if authenticated
    const authState = AuthService.getAuthState();
    if (!authState.authenticated) {
      syncState.isSyncing = false;
      syncState.syncErrors.push('Not authenticated');
      return false;
    }
    
    // Send update to server
    const response = await ApiService.syncParcelUpdates(parcelId, update, new Date());
    
    if (response.error) {
      syncState.syncErrors.push(`Sync error: ${response.error}`);
      syncState.isSyncing = false;
      return false;
    }
    
    // Update last sync time
    syncState.lastSyncTime = new Date();
    syncState.isSyncing = false;
    return true;
  } catch (error: any) {
    console.error('Sync error:', error);
    syncState.syncErrors.push(`Sync error: ${error.message}`);
    syncState.isSyncing = false;
    return false;
  }
}

/**
 * Process the sync queue
 */
async function processSyncQueue() {
  if (!NetworkService.isConnected() || syncState.isSyncing || syncState.syncQueue.length === 0) {
    return;
  }
  
  syncState.isSyncing = true;
  
  const queue = [...syncState.syncQueue];
  syncState.syncQueue = [];
  
  let successCount = 0;
  
  for (const item of queue) {
    try {
      const success = await syncParcel(item.parcelId, item.update);
      if (success) {
        successCount++;
      } else {
        // Put back in queue if failed
        syncState.syncQueue.push(item);
      }
    } catch (error: any) {
      console.error('Queue processing error:', error);
      syncState.syncErrors.push(`Queue processing error: ${error.message}`);
      syncState.syncQueue.push(item);
    }
  }
  
  syncState.isSyncing = false;
  return successCount;
}

/**
 * Sync all pending updates
 */
export async function syncAll(): Promise<boolean> {
  try {
    if (!NetworkService.isConnected()) {
      return false;
    }
    
    syncState.isSyncing = true;
    
    // Process any pending sync queue items
    await processSyncQueue();
    
    // Get all parcels that need syncing
    // This would typically involve checking the Realm database
    // for any changes that haven't been synced yet
    
    syncState.lastSyncTime = new Date();
    syncState.isSyncing = false;
    return true;
  } catch (error: any) {
    console.error('Sync all error:', error);
    syncState.syncErrors.push(`Sync all error: ${error.message}`);
    syncState.isSyncing = false;
    return false;
  }
}

/**
 * Get sync state
 */
export function getSyncState() {
  return { ...syncState };
}

/**
 * Check if currently syncing
 */
export function isSyncing(): boolean {
  return syncState.isSyncing;
}

/**
 * Clear sync errors
 */
export function clearSyncErrors() {
  syncState.syncErrors = [];
}

// Export as a service object
export const SyncService = {
  init: initSyncService,
  syncParcel,
  syncAll,
  getSyncState,
  isSyncing,
  clearSyncErrors
};

export default SyncService;