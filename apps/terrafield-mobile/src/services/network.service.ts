import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

type ConnectionListener = (isConnected: boolean) => void;

// Network connection state
const connectionState = {
  isConnected: true,
  type: 'unknown',
  isInternetReachable: true,
  lastChecked: new Date()
};

// List of connection state change listeners
const listeners: ConnectionListener[] = [];

/**
 * Initialize the network service
 */
export function initNetworkService() {
  // Subscribe to network state changes
  const unsubscribe = NetInfo.addEventListener(state => {
    updateConnectionState(state);
  });
  
  // Initial check
  NetInfo.fetch().then(state => {
    updateConnectionState(state);
  });
  
  // Return cleanup function
  return unsubscribe;
}

/**
 * Update connection state and notify listeners
 */
function updateConnectionState(state: NetInfoState) {
  const previouslyConnected = connectionState.isConnected;
  
  // Update state
  connectionState.isConnected = state.isConnected === true;
  connectionState.type = state.type;
  connectionState.isInternetReachable = state.isInternetReachable === true;
  connectionState.lastChecked = new Date();
  
  // Notify listeners only if connection state changed
  if (previouslyConnected !== connectionState.isConnected) {
    listeners.forEach(listener => {
      try {
        listener(connectionState.isConnected);
      } catch (error) {
        console.error('Error in network listener:', error);
      }
    });
  }
}

/**
 * Add a listener for connection state changes
 */
export function addConnectionListener(listener: ConnectionListener): () => void {
  listeners.push(listener);
  
  // Call immediately with current state
  try {
    listener(connectionState.isConnected);
  } catch (error) {
    console.error('Error in network listener:', error);
  }
  
  // Return unsubscribe function
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * Check if the device is currently connected
 */
export function isConnected(): boolean {
  return connectionState.isConnected;
}

/**
 * Get the current connection state
 */
export function getConnectionState() {
  return { ...connectionState };
}

/**
 * Force a connection check
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    updateConnectionState(state);
    return connectionState.isConnected;
  } catch (error) {
    console.error('Error checking connection:', error);
    return false;
  }
}

// Export as a service object
export const NetworkService = {
  init: initNetworkService,
  addListener: addConnectionListener,
  isConnected,
  getState: getConnectionState,
  checkConnection
};

export default NetworkService;