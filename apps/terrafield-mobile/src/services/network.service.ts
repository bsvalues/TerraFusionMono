import { Platform, NetInfo } from 'react-native';
import { syncService } from './sync.service';

/**
 * Network status types
 */
export type ConnectionType = 'unknown' | 'none' | 'wifi' | 'cellular' | 'bluetooth' | 'ethernet' | 'wimax';

/**
 * Network status service for monitoring connectivity
 */
class NetworkService {
  private isOnline: boolean = true;
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  
  constructor() {
    this.initialize();
  }
  
  /**
   * Initialize network monitoring
   */
  private initialize() {
    // Set up network status monitoring
    if (Platform.OS !== 'web') {
      // This is a simplified implementation
      // In a real app, use NetInfo.addEventListener
      NetInfo.fetch().then(state => {
        this.updateOnlineStatus(state.isConnected);
      });
      
      // Subscribe to network status changes
      NetInfo.addEventListener(state => {
        this.updateOnlineStatus(state.isConnected);
      });
    } else {
      // For web
      window.addEventListener('online', () => this.updateOnlineStatus(true));
      window.addEventListener('offline', () => this.updateOnlineStatus(false));
      
      // Initialize with current status
      this.updateOnlineStatus(navigator.onLine);
    }
  }
  
  /**
   * Update the online status and notify all listeners
   * @param isOnline Whether the device is online
   */
  private updateOnlineStatus(isOnline: boolean | null) {
    const wasOnline = this.isOnline;
    this.isOnline = !!isOnline;
    
    // Only notify if the status changed
    if (wasOnline !== this.isOnline) {
      // Notify all listeners
      this.listeners.forEach(listener => listener(this.isOnline));
      
      // Log the change
      console.log(`Network status changed. Online: ${this.isOnline}`);
      
      // Update the sync service
      syncService.setOnlineStatus(this.isOnline);
      
      // Attempt to process the sync queue if we're back online
      if (this.isOnline && !wasOnline) {
        syncService.forceSyncAll().catch(error => {
          console.error('Failed to process sync queue:', error);
        });
      }
    }
  }
  
  /**
   * Get the current online status
   * @returns Whether the device is online
   */
  public isNetworkOnline(): boolean {
    return this.isOnline;
  }
  
  /**
   * Add a listener for network status changes
   * @param listener Function to call when network status changes
   */
  public addListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);
    
    // Call the listener immediately with the current status
    listener(this.isOnline);
    
    // Return a function to remove the listener
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  /**
   * Remove a listener for network status changes
   * @param listener The listener to remove
   */
  public removeListener(listener: (isOnline: boolean) => void): void {
    this.listeners.delete(listener);
  }
  
  /**
   * Manually set the online status (useful for testing)
   * @param isOnline Whether the device is online
   */
  public manuallySetOnlineStatus(isOnline: boolean): void {
    this.updateOnlineStatus(isOnline);
  }
}

export const networkService = new NetworkService();