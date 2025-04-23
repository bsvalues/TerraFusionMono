import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Subject, Observable } from 'rxjs';

/**
 * Network service to monitor and manage connectivity status
 * Tracks the device's network connection state and provides events for changes
 */
export class NetworkService {
  private static instance: NetworkService;
  
  // Observable for network state changes
  private networkStateSubject = new Subject<NetworkStatus>();
  public networkState$: Observable<NetworkStatus> = this.networkStateSubject.asObservable();
  
  // Current network state
  private _currentStatus: NetworkStatus = { 
    isConnected: false, 
    isInternetReachable: false,
    type: 'unknown',
    details: null
  };

  // Prevent direct instantiation
  private constructor() {
    // Initialize network monitoring
    this.startNetworkMonitoring();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  /**
   * Set up network state monitoring
   */
  private startNetworkMonitoring(): void {
    // Start listening for network changes
    NetInfo.addEventListener(this.handleNetworkChange);
    
    // Initial network state check
    this.checkNetworkStatus();
  }

  /**
   * Handle network state changes
   */
  private handleNetworkChange = (state: NetInfoState): void => {
    const newStatus: NetworkStatus = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? false,
      type: state.type,
      details: state.details
    };
    
    // Update current status
    this._currentStatus = newStatus;
    
    // Emit the new state to subscribers
    this.networkStateSubject.next(newStatus);
    
    console.log('Network status changed:', JSON.stringify(newStatus));
  };

  /**
   * Check the current network status
   */
  public async checkNetworkStatus(): Promise<NetworkStatus> {
    const state = await NetInfo.fetch();
    
    const newStatus: NetworkStatus = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? false,
      type: state.type,
      details: state.details
    };
    
    // Update current status
    this._currentStatus = newStatus;
    
    // Emit the new state to subscribers
    this.networkStateSubject.next(newStatus);
    
    return newStatus;
  }

  /**
   * Get the current network status
   */
  public get currentStatus(): NetworkStatus {
    return this._currentStatus;
  }

  /**
   * Check if the device is online
   */
  public isOnline(): boolean {
    return this._currentStatus.isConnected && this._currentStatus.isInternetReachable;
  }

  /**
   * Check if the device is on WiFi
   */
  public isWifi(): boolean {
    return this._currentStatus.type === 'wifi';
  }

  /**
   * Check if the device is on cellular network
   */
  public isCellular(): boolean {
    return this._currentStatus.type === 'cellular';
  }
}

/**
 * Network status interface
 */
export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
  details: any;
}

// Export the singleton instance
export const networkService = NetworkService.getInstance();

export default networkService;