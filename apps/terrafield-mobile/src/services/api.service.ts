import { BehaviorSubject } from 'rxjs';
import Config from '../config';
import authService from './auth.service';
import networkService from './network.service';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  requiresAuth?: boolean;
  forceOffline?: boolean;
  cacheResponse?: boolean;
}

interface SyncQueueItem {
  id: string;
  endpoint: string;
  method: string;
  body: any;
  timestamp: number;
  retryCount: number;
}

/**
 * API service for handling network requests with offline support
 */
class ApiService {
  private syncQueue: SyncQueueItem[] = [];
  private syncQueueLoaded = false;

  /**
   * Initialize the API service
   */
  public async initialize(): Promise<void> {
    // Load sync queue from persistent storage
    await this.loadSyncQueue();
    this.syncQueueLoaded = true;
  }

  /**
   * Make an API request
   * @param endpoint API endpoint to call
   * @param options Request options
   */
  public async request<T = any>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      body,
      headers = {},
      timeout = Config.API.TIMEOUT,
      requiresAuth = true,
      forceOffline = false,
      cacheResponse = true
    } = options;

    // Check if we're offline or forced offline mode
    const isOffline = forceOffline || !networkService.isOnline();

    // If offline and this is a mutation, add to sync queue
    if (isOffline && method !== 'GET') {
      return this.handleOfflineMutation<T>(endpoint, method, body);
    }

    // Add authentication token if required
    let requestHeaders = { ...headers };
    if (requiresAuth) {
      const token = await authService.getToken();
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    // Set content type for requests with body
    if (body && !requestHeaders['Content-Type']) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    try {
      // Create request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${Config.API.BASE_URL}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Parse response
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle response based on status code
      if (response.ok) {
        return {
          success: true,
          data,
          statusCode: response.status
        };
      } else {
        // Handle authentication errors
        if (response.status === 401) {
          // Token expired or invalid
          await authService.refreshToken();
          
          // Retry the request with new token if refresh succeeded
          if (authService.isAuthenticated()) {
            return this.request(endpoint, options);
          }
        }

        return {
          success: false,
          error: data.message || 'Request failed',
          statusCode: response.status
        };
      }
    } catch (error: any) {
      // Handle network errors
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timed out',
          statusCode: 408
        };
      }

      // If we're offline and this is a GET request, try to get from cache
      if (isOffline && method === 'GET') {
        return this.handleOfflineRead<T>(endpoint);
      }

      return {
        success: false,
        error: error.message || 'Network request failed',
        statusCode: 0
      };
    }
  }

  /**
   * Handle offline mutation by adding to sync queue
   */
  private async handleOfflineMutation<T>(
    endpoint: string,
    method: string,
    body: any
  ): Promise<ApiResponse<T>> {
    // Generate unique ID for this request
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Add to sync queue
    this.syncQueue.push({
      id,
      endpoint,
      method,
      body,
      timestamp: Date.now(),
      retryCount: 0
    });
    
    // Save sync queue to persistent storage
    await this.saveSyncQueue();
    
    return {
      success: true,
      data: { id, queued: true } as any,
      statusCode: 202
    };
  }

  /**
   * Handle offline read by checking cache
   */
  private async handleOfflineRead<T>(endpoint: string): Promise<ApiResponse<T>> {
    // In a real implementation, this would check local storage or a database
    // for cached responses. For now, we'll just return an error.
    return {
      success: false,
      error: 'Offline and data not available in cache',
      statusCode: 503
    };
  }

  /**
   * Load sync queue from persistent storage
   */
  private async loadSyncQueue(): Promise<void> {
    // In a real implementation, this would load from AsyncStorage or similar
    // For now, we'll just use an empty array
    this.syncQueue = [];
  }

  /**
   * Save sync queue to persistent storage
   */
  private async saveSyncQueue(): Promise<void> {
    // In a real implementation, this would save to AsyncStorage or similar
  }

  /**
   * Get the current sync queue
   */
  public async getSyncQueue(): Promise<SyncQueueItem[]> {
    if (!this.syncQueueLoaded) {
      await this.loadSyncQueue();
    }
    return [...this.syncQueue];
  }

  /**
   * Process pending items in the sync queue
   */
  public async processSyncQueue(): Promise<boolean> {
    if (!networkService.isOnline()) {
      return false;
    }

    // Skip if queue is empty
    if (this.syncQueue.length === 0) {
      return true;
    }

    let allSuccess = true;

    // Process each item in the queue
    for (const item of [...this.syncQueue]) {
      try {
        const response = await this.request(item.endpoint, {
          method: item.method as any,
          body: item.body,
          requiresAuth: true,
          forceOffline: false
        });

        if (response.success) {
          // Remove successful item from queue
          this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
        } else {
          // Increment retry count
          const index = this.syncQueue.findIndex(i => i.id === item.id);
          if (index >= 0) {
            this.syncQueue[index].retryCount += 1;
            
            // Remove if we've exceeded max retries
            if (this.syncQueue[index].retryCount > Config.API.RETRY_COUNT) {
              this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
              allSuccess = false;
            }
          }
        }
      } catch (error) {
        console.error('Error processing sync queue item:', error);
        allSuccess = false;
      }
    }

    // Save updated queue
    await this.saveSyncQueue();

    return allSuccess;
  }
}

const apiService = new ApiService();
export default apiService;