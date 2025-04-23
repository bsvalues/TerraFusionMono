import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { apiBaseUrl } from '../config';
import { appConfig } from '../config';

class NetworkService {
  private isConnected: boolean = true;
  private hasInternet: boolean = true;
  private lastChecked: Date = new Date();
  private listeners: ((isOnline: boolean) => void)[] = [];
  private checkInterval: any = null;
  private pingTimeout = 10000; // 10 seconds timeout for ping

  constructor() {
    // Subscribe to connection info updates
    this.setupConnectionMonitoring();
  }

  /**
   * Sets up connection monitoring using NetInfo
   */
  private setupConnectionMonitoring() {
    // Subscribe to network info updates
    NetInfo.addEventListener(this.handleNetInfoChange);
    
    // Initial check
    this.checkConnectivity();
    
    // Set up periodic check (every minute)
    this.checkInterval = setInterval(() => {
      this.checkConnectivity();
    }, 60 * 1000);
  }

  /**
   * Handles network info changes
   */
  private handleNetInfoChange = (state: NetInfoState) => {
    // Update connection status
    const wasConnected = this.isConnected;
    this.isConnected = !!state.isConnected;
    
    // If connection type changes, check internet connectivity
    if (this.isConnected !== wasConnected) {
      if (this.isConnected) {
        // Connection restored, check if we have internet
        this.pingServer();
      } else {
        // Connection lost, update internet status and notify listeners
        this.hasInternet = false;
        this.notifyListeners();
      }
    }
  };

  /**
   * Actually check network connectivity by pinging the server
   */
  private async checkConnectivity() {
    // First check if device is connected to a network
    const netInfo = await NetInfo.fetch();
    this.isConnected = !!netInfo.isConnected;
    
    // If connected to network, check internet by pinging server
    if (this.isConnected) {
      await this.pingServer();
    } else {
      this.hasInternet = false;
      this.notifyListeners();
    }
    
    this.lastChecked = new Date();
  }

  /**
   * Ping the server to check internet connectivity
   */
  private async pingServer() {
    try {
      // Try to ping API server with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.pingTimeout);
      
      const response = await fetch(`${apiBaseUrl}/api/ping`, {
        method: 'HEAD',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // If we get here, we have internet
      const newStatus = response.ok;
      
      // Only notify if status changed
      if (this.hasInternet !== newStatus) {
        this.hasInternet = newStatus;
        this.notifyListeners();
      }
    } catch (error) {
      // Network error, probably no internet
      if (this.hasInternet) {
        this.hasInternet = false;
        this.notifyListeners();
      }
      
      if (appConfig.dev.verboseLogging) {
        console.log('Network ping failed:', error);
      }
    }
  }

  /**
   * Notify listeners of network status changes
   */
  private notifyListeners() {
    const isOnline = this.isConnected && this.hasInternet;
    this.listeners.forEach(listener => {
      try {
        listener(isOnline);
      } catch (error) {
        console.error('Error in network listener:', error);
      }
    });
  }

  /**
   * Add a listener for network status changes
   * @returns A function to remove the listener
   */
  public addListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately notify with current status
    listener(this.isConnected && this.hasInternet);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Force a check of network connectivity
   */
  public async checkConnection(): Promise<boolean> {
    await this.checkConnectivity();
    return this.isConnected && this.hasInternet;
  }

  /**
   * Get current network status
   */
  public isOnline(): boolean {
    return this.isConnected && this.hasInternet;
  }

  /**
   * Get last time network was checked
   */
  public getLastChecked(): Date {
    return this.lastChecked;
  }

  /**
   * Clean up resources
   */
  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    // Could unsubscribe from NetInfo here if needed
  }
}

// Create singleton instance
export const networkService = new NetworkService();