import { networkService } from './network.service';
import authService from './auth.service';
import { addToSyncQueue, getSyncQueue, removeFromSyncQueue, incrementSyncAttempt } from '../utils/realm';
import { Platform } from 'react-native';
import Config from '../config';

// Type for API request options
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
  bypassOfflineQueue?: boolean;
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

// Type for API error response
export interface ApiErrorResponse {
  status: number;
  message: string;
  errors?: any;
}

/**
 * API Service for handling network requests with offline support
 * Provides methods for making API calls and manages offline queueing
 */
export class ApiService {
  private static instance: ApiService;
  private syncInProgress: boolean = false;
  private maxRetries: number = 3;
  private baseRetryDelay: number = 2000; // 2 seconds
  private syncInterval: any = null;
  
  // Event callbacks
  private onSyncStartCallbacks: Array<() => void> = [];
  private onSyncCompleteCallbacks: Array<(success: boolean) => void> = [];
  
  // Base URL for API requests
  private readonly baseUrl: string = Config.API_URL;
  
  // Default headers for all requests
  private readonly defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Version': Config.APP_VERSION,
    'X-Client-Platform': Platform.OS,
  };
  
  // Default request options
  private readonly defaultOptions: ApiRequestOptions = {
    method: 'GET',
    requiresAuth: true,
    bypassOfflineQueue: false,
    retries: 1,
    retryDelay: 1000,
    timeout: 30000,
  };

  // Private constructor to enforce singleton pattern
  private constructor() {
    // Initialize the sync timer that periodically checks for offline requests to sync
    this.startSyncTimer();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Make an API request with automatic token handling and offline support
   * 
   * @param endpoint - API endpoint path (without base URL)
   * @param options - Request options
   * @returns Promise resolving to the response data
   */
  public async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    // Merge with default options
    const mergedOptions: ApiRequestOptions = {
      ...this.defaultOptions,
      ...options,
    };
    
    // Prepare headers
    const headers = {
      ...this.defaultHeaders,
      ...mergedOptions.headers,
    };
    
    // Add auth token if required
    if (mergedOptions.requiresAuth) {
      const token = await authService.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (!mergedOptions.bypassOfflineQueue) {
        // Can't authenticate, likely offline
        throw new Error('No authentication token available');
      }
    }
    
    // Check network status
    const isOnline = networkService.isOnline();
    
    // If offline and not bypassing queue, add to sync queue
    if (!isOnline && !mergedOptions.bypassOfflineQueue) {
      // Only support POST, PUT, DELETE for offline queueing
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(mergedOptions.method)) {
        return this.queueOfflineRequest<T>(endpoint, mergedOptions);
      } else {
        throw new Error('Network unavailable and GET requests cannot be queued for offline use');
      }
    }
    
    // Online or bypass queue, make actual request
    try {
      const fullUrl = this.getFullUrl(endpoint);
      
      // Handle request timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), mergedOptions.timeout);
      });
      
      // Actual fetch request
      const fetchPromise = this.executeFetch<T>(fullUrl, {
        method: mergedOptions.method,
        headers,
        body: mergedOptions.body ? JSON.stringify(mergedOptions.body) : undefined,
      }, mergedOptions.retries, mergedOptions.retryDelay);
      
      // Race between fetch and timeout
      return Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
      // If fetch fails due to network issues and not already bypassing queue
      if (!mergedOptions.bypassOfflineQueue && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(mergedOptions.method)) {
        return this.queueOfflineRequest<T>(endpoint, mergedOptions);
      }
      throw error;
    }
  }

  /**
   * Execute a fetch request with retry capability
   */
  private async executeFetch<T>(
    url: string, 
    fetchOptions: RequestInit, 
    retries: number = 1, 
    retryDelay: number = 1000
  ): Promise<T> {
    try {
      const response = await fetch(url, fetchOptions);
      
      // Parse response
      let responseData: any;
      const contentType = response.headers.get('Content-Type') || '';
      
      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
      
      // Handle error responses
      if (!response.ok) {
        const apiError: ApiErrorResponse = {
          status: response.status,
          message: typeof responseData === 'string' ? responseData : responseData.message || response.statusText,
          errors: responseData.errors,
        };
        
        // Handle authentication errors
        if (response.status === 401) {
          // Try to refresh token if needed
          const refreshed = await authService.refreshToken();
          if (refreshed) {
            // Update Authorization header with new token
            const newHeaders = { ...fetchOptions.headers } as Record<string, string>;
            newHeaders['Authorization'] = `Bearer ${await authService.getToken()}`;
            
            // Retry with new token
            return this.executeFetch<T>(url, {
              ...fetchOptions,
              headers: newHeaders,
            }, 1, 0);
          }
        }
        
        throw apiError;
      }
      
      return responseData as T;
    } catch (error) {
      // Check if we should retry
      if (retries > 0) {
        // Exponential backoff
        const delay = retryDelay * (Math.pow(2, this.defaultOptions.retries - retries));
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the request
        return this.executeFetch<T>(url, fetchOptions, retries - 1, retryDelay);
      }
      
      throw error;
    }
  }

  /**
   * Queue a request for processing when back online
   */
  private async queueOfflineRequest<T>(endpoint: string, options: ApiRequestOptions): Promise<T> {
    // Generate a unique ID for this request
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Add to offline queue in Realm
    await addToSyncQueue(
      options.method as 'create' | 'update' | 'delete',
      this.getEntityTypeFromEndpoint(endpoint),
      requestId,
      {
        endpoint,
        options: {
          method: options.method,
          body: options.body,
          headers: options.headers,
        }
      }
    );
    
    console.log(`Request queued for offline processing: ${options.method} ${endpoint}`);
    
    // Return a "fake" success response to allow the app to continue
    // The actual result will be processed when online
    return {
      success: true,
      message: 'Request queued for processing when online',
      offline: true,
      requestId,
    } as unknown as T;
  }

  /**
   * Process offline queue when back online
   */
  public async processSyncQueue(force: boolean = false): Promise<boolean> {
    // Check if already syncing or if offline and not forced
    if (this.syncInProgress || (!networkService.isOnline() && !force)) {
      return false;
    }
    
    try {
      this.syncInProgress = true;
      this.notifySyncStart();
      
      // Get queued requests
      const queue = await getSyncQueue();
      
      if (queue.length === 0) {
        this.notifySyncComplete(true);
        return true;
      }
      
      console.log(`Processing sync queue: ${queue.length} items`);
      
      // Process each item in queue
      let success = true;
      
      for (const item of queue) {
        try {
          if (item.attempts >= this.maxRetries) {
            console.warn(`Sync item ${item.id} exceeded max retries, removing from queue`);
            await removeFromSyncQueue(item.id);
            continue;
          }
          
          // Extract request details
          const { endpoint, options } = item.data;
          
          // Make the actual request
          await this.request(endpoint, {
            ...options,
            bypassOfflineQueue: true,
          });
          
          // If successful, remove from queue
          await removeFromSyncQueue(item.id);
          console.log(`Successfully synced: ${options.method} ${endpoint}`);
        } catch (error) {
          success = false;
          console.error(`Error syncing item ${item.id}:`, error);
          
          // Increment retry count
          await incrementSyncAttempt(item.id);
        }
      }
      
      this.notifySyncComplete(success);
      return success;
    } catch (error) {
      console.error('Error processing sync queue:', error);
      this.notifySyncComplete(false);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Start the sync timer to periodically check for offline requests
   */
  private startSyncTimer(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Check every 30 seconds if online
    this.syncInterval = setInterval(() => {
      if (networkService.isOnline()) {
        this.processSyncQueue();
      }
    }, 30000);
  }

  /**
   * Stop the sync timer
   */
  public stopSyncTimer(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Get the full URL for an endpoint
   */
  private getFullUrl(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    // Ensure no double slashes
    const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    return `${baseUrl}${path}`;
  }

  /**
   * Extract entity type from endpoint
   */
  private getEntityTypeFromEndpoint(endpoint: string): 'parcel' | 'note' {
    if (endpoint.includes('parcels') && !endpoint.includes('notes')) {
      return 'parcel';
    } else if (endpoint.includes('notes')) {
      return 'note';
    }
    
    // Default to parcel
    return 'parcel';
  }

  /**
   * Register callback for sync start
   */
  public onSyncStart(callback: () => void): void {
    this.onSyncStartCallbacks.push(callback);
  }

  /**
   * Register callback for sync completion
   */
  public onSyncComplete(callback: (success: boolean) => void): void {
    this.onSyncCompleteCallbacks.push(callback);
  }

  /**
   * Notify sync started
   */
  private notifySyncStart(): void {
    this.onSyncStartCallbacks.forEach(callback => callback());
  }

  /**
   * Notify sync completed
   */
  private notifySyncComplete(success: boolean): void {
    this.onSyncCompleteCallbacks.forEach(callback => callback(success));
  }
  
  /**
   * Get the sync status
   */
  public isSyncing(): boolean {
    return this.syncInProgress;
  }
}

// Export the singleton instance
export const apiService = ApiService.getInstance();

export default apiService;