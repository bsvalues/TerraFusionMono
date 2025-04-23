import { apiBaseUrl } from '../config';
import { authService } from './auth.service';
import { appConfig } from '../config';
import NetInfo from '@react-native-community/netinfo';

// Type definitions
interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
  timeout?: number;
}

interface ApiError extends Error {
  status?: number;
  data?: any;
}

class ApiService {
  private networkListeners: ((isConnected: boolean) => void)[] = [];
  private isConnected: boolean = true;

  constructor() {
    // Initialize network monitoring
    this.setupNetworkMonitoring();
  }

  /**
   * Set up network connection monitoring
   */
  private setupNetworkMonitoring() {
    // Subscribe to network info updates
    NetInfo.addEventListener(state => {
      const connected = !!state.isConnected;
      
      // Update connection status if changed
      if (this.isConnected !== connected) {
        this.isConnected = connected;
        
        // Notify listeners
        this.networkListeners.forEach(listener => {
          listener(this.isConnected);
        });
      }
    });
  }

  /**
   * Subscribe to network connection changes
   */
  public addNetworkListener(listener: (isConnected: boolean) => void): () => void {
    this.networkListeners.push(listener);
    
    // Immediately notify with current status
    listener(this.isConnected);
    
    // Return unsubscribe function
    return () => {
      this.networkListeners = this.networkListeners.filter(l => l !== listener);
    };
  }

  /**
   * Get current network connection status
   */
  public isNetworkConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Make an API request with proper error handling and timeout
   */
  private async request(endpoint: string, options: RequestOptions = {}): Promise<any> {
    // Check if network is connected
    if (!this.isConnected) {
      const error = new Error('No network connection') as ApiError;
      error.status = 0;
      throw error;
    }

    // Default options
    const defaultOptions: RequestOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second default timeout
      requireAuth: true,
    };

    // Merge with provided options
    const requestOptions = { ...defaultOptions, ...options };
    const { timeout, requireAuth, ...fetchOptions } = requestOptions;

    // Add auth token if required
    if (requireAuth) {
      const token = authService.getToken();
      if (!token) {
        const error = new Error('Authentication required') as ApiError;
        error.status = 401;
        throw error;
      }
      
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Authorization': `Bearer ${token}`
      };
    }

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${timeout}ms`));
        }, timeout);
      });

      // Create fetch promise
      const fetchPromise = fetch(`${apiBaseUrl}${endpoint}`, fetchOptions);

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      // Handle non-2xx responses
      if (!response.ok) {
        const error = new Error(`API error: ${response.statusText}`) as ApiError;
        error.status = response.status;
        
        // Try to parse error details
        try {
          error.data = await response.json();
        } catch (e) {
          // If we can't parse JSON, use text
          error.data = await response.text();
        }
        
        throw error;
      }
      
      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error: any) {
      // Log detailed error information in development
      if (appConfig.dev.verboseLogging) {
        console.error(`API request failed for ${endpoint}:`, error);
      }
      
      // Rethrow with additional context
      const apiError = error as ApiError;
      if (!apiError.status) {
        apiError.status = 0; // Network or other non-HTTP error
      }
      
      throw apiError;
    }
  }

  /**
   * Make a GET request to the API
   */
  async get(endpoint: string, options: RequestOptions = {}): Promise<any> {
    return this.request(endpoint, {
      method: 'GET',
      ...options
    });
  }

  /**
   * Make a POST request to the API
   */
  async post(endpoint: string, body: any, options: RequestOptions = {}): Promise<any> {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options
    });
  }

  /**
   * Make a PUT request to the API
   */
  async put(endpoint: string, body: any, options: RequestOptions = {}): Promise<any> {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options
    });
  }

  /**
   * Make a PATCH request to the API
   */
  async patch(endpoint: string, body: any, options: RequestOptions = {}): Promise<any> {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options
    });
  }

  /**
   * Make a DELETE request to the API
   */
  async delete(endpoint: string, options: RequestOptions = {}): Promise<any> {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options
    });
  }

  /**
   * Fetch parcel data by ID
   */
  async getParcel(parcelId: string): Promise<any> {
    return this.get(`/api/mobile/parcels/${parcelId}`);
  }

  /**
   * Fetch all parcels (with optional filtering)
   */
  async getParcels(filters: Record<string, any> = {}): Promise<any> {
    // Convert filters to query string
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const queryString = queryParams.toString();
    const endpoint = `/api/mobile/parcels${queryString ? `?${queryString}` : ''}`;
    
    return this.get(endpoint);
  }

  /**
   * Fetch parcel notes for a specific parcel
   */
  async getParcelNotes(parcelId: string): Promise<any> {
    return this.get(`/api/mobile/parcels/${parcelId}/notes`);
  }

  /**
   * Save parcel note update
   */
  async saveParcelNote(parcelId: string, noteData: any): Promise<any> {
    return this.post(`/api/mobile/parcels/${parcelId}/notes`, noteData);
  }

  /**
   * Send sync data to server
   */
  async syncData(syncData: any): Promise<any> {
    return this.post('/api/mobile/sync', syncData);
  }
}

export const apiService = new ApiService();