import { BehaviorSubject } from 'rxjs';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  connectionType: string | null;
  lastChecked: Date;
}

/**
 * Network service for monitoring connectivity state
 */
class NetworkService {
  private _networkState = new BehaviorSubject<NetworkState>({
    isConnected: true,
    isInternetReachable: true,
    connectionType: 'wifi',
    lastChecked: new Date()
  });

  /**
   * Initialize the network monitoring
   */
  public async initialize(): Promise<void> {
    // In a real implementation, this would set up listeners for network state changes
    // using something like NetInfo from '@react-native-community/netinfo'
    
    // For now, we'll just simulate an online state
    this.setNetworkState({
      isConnected: true,
      isInternetReachable: true,
      connectionType: 'wifi',
      lastChecked: new Date()
    });
    
    // Set up periodic network checks
    setInterval(() => this.checkNetworkStatus(), 30000); // Check every 30 seconds
  }

  /**
   * Observable for network state changes
   */
  public get networkState$() {
    return this._networkState.asObservable();
  }

  /**
   * Check if the device is currently online
   */
  public isOnline(): boolean {
    const state = this._networkState.value;
    return state.isConnected && state.isInternetReachable;
  }

  /**
   * Check current network status
   */
  public async checkNetworkStatus(): Promise<NetworkState> {
    try {
      // In a real implementation, this would check the network state
      // using NetInfo.fetch()
      
      // For now, we'll just simulate a successful check
      const state: NetworkState = {
        isConnected: true,
        isInternetReachable: true,
        connectionType: 'wifi',
        lastChecked: new Date()
      };
      
      this.setNetworkState(state);
      return state;
    } catch (error) {
      console.error('Error checking network status:', error);
      
      // Assume offline if there's an error
      const offlineState: NetworkState = {
        isConnected: false,
        isInternetReachable: false,
        connectionType: null,
        lastChecked: new Date()
      };
      
      this.setNetworkState(offlineState);
      return offlineState;
    }
  }

  /**
   * Set the current network state and notify subscribers
   */
  private setNetworkState(state: NetworkState): void {
    this._networkState.next(state);
  }

  /**
   * Check if a specific host is reachable
   */
  public async isHostReachable(host: string): Promise<boolean> {
    try {
      // In a real implementation, this would make a fetch request to the host
      // to check if it's reachable
      
      // For now, we'll just return true if we're online
      return this.isOnline();
    } catch (error) {
      console.error(`Error checking if host ${host} is reachable:`, error);
      return false;
    }
  }
}

const networkService = new NetworkService();
export default networkService;