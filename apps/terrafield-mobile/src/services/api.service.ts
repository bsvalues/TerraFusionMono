import { BehaviorSubject } from 'rxjs';
import Config from '../config';
import authService from './auth.service';
import networkService from './network.service';
import { SyncQueueRepository, ParcelRepository, ParcelNoteRepository } from '../utils/realm';

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
  resourceType?: 'parcel' | 'parcelNote' | 'other';
  resourceId?: string;
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
  private _isInitialized = false;

  /**
   * Initialize the API service
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) {
      return;
    }
    
    try {
      // Nothing to specifically initialize here - the Realm repositories
      // handle their own initialization
      this._isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize API service:', error);
      throw error;
    }
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
      cacheResponse = true,
      resourceType = 'other',
      resourceId
    } = options;

    // Check if we're offline or forced offline mode
    const isOffline = forceOffline || !networkService.isOnline();

    // If offline and this is a mutation (not GET), add to sync queue
    if (isOffline && method !== 'GET') {
      return this.handleOfflineMutation<T>(endpoint, method, body, resourceType, resourceId);
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
        // If this was a successful GET request for a cacheable resource type,
        // update the local cache
        if (method === 'GET' && cacheResponse) {
          await this.updateCache(resourceType, data, resourceId);
        }
        
        // If this was a successful mutation and we have a resourceId,
        // mark the local resource as synced
        if (method !== 'GET' && resourceType !== 'other' && resourceId) {
          await this.markResourceSynced(resourceType, resourceId);
        }
        
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
      if ((isOffline || !networkService.isOnline()) && method === 'GET') {
        return this.handleOfflineRead<T>(endpoint, resourceType, resourceId);
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
    body: any,
    resourceType: string,
    resourceId?: string
  ): Promise<ApiResponse<T>> {
    try {
      // Add to sync queue in Realm
      const queueItem = await SyncQueueRepository.add({
        endpoint,
        method,
        body
      });
      
      // For certain resource types, we need to update the local database directly
      if (resourceType !== 'other' && resourceId) {
        // Handle based on the resource type and method
        // In a real implementation, this would be more robust
        if (resourceType === 'parcel' && method === 'PATCH') {
          await ParcelRepository.update(resourceId, body);
        } else if (resourceType === 'parcelNote' && method === 'PATCH') {
          await ParcelNoteRepository.update(resourceId, body);
        }
      }
      
      return {
        success: true,
        data: { id: queueItem.id, queued: true } as any,
        statusCode: 202
      };
    } catch (error) {
      console.error('Error handling offline mutation:', error);
      return {
        success: false,
        error: 'Failed to save operation for offline sync',
        statusCode: 500
      };
    }
  }

  /**
   * Handle offline read by checking cache
   */
  private async handleOfflineRead<T>(
    endpoint: string,
    resourceType: string,
    resourceId?: string
  ): Promise<ApiResponse<T>> {
    try {
      // Handle based on resource type and endpoint pattern
      if (resourceType === 'parcel' && resourceId) {
        const parcel = await ParcelRepository.getById(resourceId);
        if (parcel) {
          return {
            success: true,
            data: parcel as any,
            statusCode: 200
          };
        }
      } else if (resourceType === 'parcel' && endpoint.includes('/api/mobile/parcels')) {
        const parcels = await ParcelRepository.getAll();
        return {
          success: true,
          data: parcels as any,
          statusCode: 200
        };
      } else if (resourceType === 'parcelNote' && resourceId) {
        // Extract parcelId from the endpoint or use resourceId directly
        const parcelId = resourceId.includes('/') ? resourceId.split('/').pop() : resourceId;
        if (parcelId) {
          const note = await ParcelNoteRepository.getByParcelId(parcelId);
          if (note) {
            return {
              success: true,
              data: note as any,
              statusCode: 200
            };
          }
        }
      }
      
      // No cached data available
      return {
        success: false,
        error: 'Offline and data not available in cache',
        statusCode: 503
      };
    } catch (error) {
      console.error('Error reading from cache:', error);
      return {
        success: false,
        error: 'Error reading from offline cache',
        statusCode: 500
      };
    }
  }

  /**
   * Update the local cache with data from a successful GET request
   */
  private async updateCache(
    resourceType: string,
    data: any,
    resourceId?: string
  ): Promise<void> {
    try {
      // Handle based on resource type
      if (resourceType === 'parcel' && Array.isArray(data)) {
        // Update multiple parcels
        // In a real implementation, this would use batch operations
        for (const parcel of data) {
          const existingParcel = await ParcelRepository.getById(parcel.id);
          if (existingParcel) {
            await ParcelRepository.update(parcel.id, parcel);
          } else {
            await ParcelRepository.create(parcel);
          }
        }
      } else if (resourceType === 'parcel' && data && resourceId) {
        // Update a single parcel
        const existingParcel = await ParcelRepository.getById(resourceId);
        if (existingParcel) {
          await ParcelRepository.update(resourceId, data);
        } else {
          await ParcelRepository.create(data);
        }
      } else if (resourceType === 'parcelNote' && data && resourceId) {
        // Update a parcel note
        const parcelId = resourceId.includes('/') ? resourceId.split('/').pop() : resourceId;
        if (parcelId) {
          const existingNote = await ParcelNoteRepository.getByParcelId(parcelId);
          if (existingNote) {
            await ParcelNoteRepository.update(existingNote.id, data);
          } else {
            await ParcelNoteRepository.create({
              ...data,
              parcelId
            });
          }
        }
      }
    } catch (error) {
      console.error('Error updating cache:', error);
    }
  }

  /**
   * Mark a resource as synced with the server
   */
  private async markResourceSynced(
    resourceType: string,
    resourceId: string
  ): Promise<void> {
    try {
      if (resourceType === 'parcel') {
        await ParcelRepository.markSynced(resourceId);
      } else if (resourceType === 'parcelNote') {
        await ParcelNoteRepository.markSynced(resourceId);
      }
    } catch (error) {
      console.error('Error marking resource as synced:', error);
    }
  }

  /**
   * Get the current sync queue
   */
  public async getSyncQueue(): Promise<any[]> {
    try {
      return await SyncQueueRepository.getAll();
    } catch (error) {
      console.error('Error getting sync queue:', error);
      return [];
    }
  }

  /**
   * Process pending items in the sync queue
   */
  public async processSyncQueue(): Promise<boolean> {
    if (!networkService.isOnline()) {
      return false;
    }

    // Get all items from the sync queue
    const syncQueue = await SyncQueueRepository.getAll();
    
    // Skip if queue is empty
    if (syncQueue.length === 0) {
      return true;
    }

    let allSuccess = true;

    // Process each item in the queue
    for (const item of syncQueue) {
      try {
        // Mark item as processing
        await SyncQueueRepository.markProcessing(item.id, true);
        
        const body = JSON.parse(item.body);
        
        const response = await this.request(item.endpoint, {
          method: item.method as any,
          body,
          requiresAuth: true,
          forceOffline: false
        });

        if (response.success) {
          // Remove successful item from queue
          await SyncQueueRepository.remove(item.id);
        } else {
          // Increment retry count
          await SyncQueueRepository.incrementRetryCount(item.id);
          
          // Remove if we've exceeded max retries
          if (item.retryCount + 1 > Config.API.RETRY_COUNT) {
            await SyncQueueRepository.remove(item.id);
            allSuccess = false;
          } else {
            // Mark as no longer processing
            await SyncQueueRepository.markProcessing(item.id, false);
          }
        }
      } catch (error) {
        console.error('Error processing sync queue item:', error);
        
        // Mark as no longer processing
        await SyncQueueRepository.markProcessing(item.id, false);
        
        // Increment retry count
        await SyncQueueRepository.incrementRetryCount(item.id);
        
        // Remove if we've exceeded max retries
        if (item.retryCount + 1 > Config.API.RETRY_COUNT) {
          await SyncQueueRepository.remove(item.id);
        }
        
        allSuccess = false;
      }
    }

    return allSuccess;
  }
}

const apiService = new ApiService();
export default apiService;