import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../config';
import NetInfo from '@react-native-community/netinfo';

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// Queue for storing requests that need to be sent when connection is restored
let offlineQueue: Array<{
  url: string;
  options: ApiRequestOptions;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

// Flag to track current network status
let isOnline = true;

// Setup network status listener
NetInfo.addEventListener(state => {
  const wasOffline = !isOnline;
  isOnline = state.isConnected !== false;
  
  // If we just came back online, process the offline queue
  if (wasOffline && isOnline) {
    processOfflineQueue();
  }
});

/**
 * Process any requests that were queued while offline
 */
async function processOfflineQueue() {
  console.log(`Processing offline queue (${offlineQueue.length} items)`);
  
  // Create a copy of the queue and clear the original
  const queue = [...offlineQueue];
  offlineQueue = [];
  
  // Process each queued request
  for (const item of queue) {
    try {
      const response = await apiRequest(item.url, item.options);
      item.resolve(response);
    } catch (error) {
      item.reject(error);
    }
  }
}

/**
 * Make an API request to the server
 */
export async function apiRequest<T = any>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    headers = {},
    requiresAuth = true
  } = options;
  
  // Set up common headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Type': 'TerraField-Mobile',
    'X-Client-Version': Config.VERSION,
    'X-Client-Platform': Platform.OS,
    ...headers
  };
  
  // Add auth token if required
  if (requiresAuth) {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }
  
  // Configure the request
  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined
  };
  
  // Check for connectivity
  if (!isOnline) {
    console.log(`Device is offline. Queueing request: ${method} ${url}`);
    
    // Only queue POST/PUT/DELETE requests that change data
    if (method !== 'GET') {
      return new Promise((resolve, reject) => {
        offlineQueue.push({
          url,
          options,
          resolve,
          reject
        });
      });
    }
    
    // Return offline error for GET requests
    return {
      error: 'Device is offline. Please check your connection.',
      status: 0
    };
  }
  
  try {
    // Make the request
    const fullUrl = `${Config.API_URL}${url}`;
    console.log(`API Request: ${method} ${fullUrl}`);
    
    const response = await fetch(fullUrl, requestOptions);
    const status = response.status;
    
    // Parse the response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Handle successful response
    if (response.ok) {
      return { data, status };
    }
    
    // Handle error response
    return {
      error: data.message || 'Unknown error occurred',
      status
    };
  } catch (error: any) {
    console.error('API request error:', error);
    
    // Add to queue if it's a network error
    if (method !== 'GET' && error.message.includes('Network request failed')) {
      return new Promise((resolve, reject) => {
        offlineQueue.push({
          url,
          options,
          resolve,
          reject
        });
      });
    }
    
    return {
      error: error.message || 'Network request failed',
      status: 0
    };
  }
}

export const ApiService = {
  // Authentication
  login: (username: string, password: string) => 
    apiRequest('/auth/login', {
      method: 'POST',
      body: { usernameOrEmail: username, password },
      requiresAuth: false
    }),
  
  register: (username: string, email: string, password: string) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: { username, email, password },
      requiresAuth: false
    }),
  
  validateToken: () => 
    apiRequest('/mobile/auth/validate'),
  
  // Parcels
  getParcels: () => 
    apiRequest('/mobile/parcels'),
  
  getParcel: (id: string) => 
    apiRequest(`/mobile/parcels/${id}`),
  
  // Parcel Notes
  getParcelNotes: (parcelId: string) => 
    apiRequest(`/mobile/parcels/${parcelId}/notes`),
  
  saveParcelNotes: (parcelId: string, content: string) => 
    apiRequest(`/mobile/parcels/${parcelId}/notes`, {
      method: 'POST',
      body: { content }
    }),
  
  // CRDT Sync
  getParcelUpdates: (parcelId: string) => 
    apiRequest(`/mobile/parcels/${parcelId}/updates`),
  
  syncParcelUpdates: (parcelId: string, update: string, timestamp: Date) => 
    apiRequest('/mobile/sync', {
      method: 'POST',
      body: {
        parcelId,
        update,
        timestamp: timestamp.toISOString()
      }
    }),
  
  // General utility
  ping: () => 
    apiRequest('/mobile/ping', { requiresAuth: false })
};

export default ApiService;