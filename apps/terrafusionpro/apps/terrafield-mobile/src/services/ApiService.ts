/**
 * API Service for TerraField Mobile
 * 
 * This service handles all communication with the AppraisalCore backend
 * and provides methods for REST and WebSocket connections
 */

interface ApiConfig {
  baseUrl: string;
  wsBaseUrl: string;
  timeoutMs: number;
}

export class ApiService {
  private static instance: ApiService;
  private config: ApiConfig;
  private authToken: string | null = null;
  
  private constructor(config: ApiConfig) {
    this.config = config;
  }
  
  /**
   * Get a singleton instance of the API service
   */
  public static getInstance(config?: Partial<ApiConfig>): ApiService {
    if (!ApiService.instance) {
      const defaultConfig: ApiConfig = {
        baseUrl: 'https://terrafield-api.example.com',
        wsBaseUrl: 'wss://terrafield-api.example.com',
        timeoutMs: 10000
      };
      
      ApiService.instance = new ApiService({
        ...defaultConfig,
        ...config
      });
    }
    
    return ApiService.instance;
  }
  
  /**
   * Set authentication token for API requests
   */
  public setAuthToken(token: string): void {
    this.authToken = token;
  }
  
  /**
   * Clear authentication token
   */
  public clearAuthToken(): void {
    this.authToken = null;
  }
  
  /**
   * Get current authentication status
   */
  public isAuthenticated(): boolean {
    return !!this.authToken;
  }
  
  /**
   * Create HTTP headers with authentication
   */
  private createHeaders(): Headers {
    const headers = new Headers({
      'Content-Type': 'application/json',
    });
    
    if (this.authToken) {
      headers.append('Authorization', `Bearer ${this.authToken}`);
    }
    
    return headers;
  }
  
  /**
   * Handle API response and error cases
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json() as T;
  }
  
  /**
   * Make a GET request to the API
   */
  public async get<T>(path: string, queryParams?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.config.baseUrl}${path}`);
    
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
    
    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.createHeaders(),
        signal: controller.signal
      });
      
      return await this.handleResponse<T>(response);
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  /**
   * Make a POST request to the API
   */
  public async post<T>(path: string, data: any): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.createHeaders(),
        body: JSON.stringify(data),
        signal: controller.signal
      });
      
      return await this.handleResponse<T>(response);
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  /**
   * Make a PUT request to the API
   */
  public async put<T>(path: string, data: any): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
    
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.createHeaders(),
        body: JSON.stringify(data),
        signal: controller.signal
      });
      
      return await this.handleResponse<T>(response);
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  /**
   * Make a DELETE request to the API
   */
  public async delete<T>(path: string): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.createHeaders(),
        signal: controller.signal
      });
      
      return await this.handleResponse<T>(response);
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  /**
   * Create a WebSocket connection for real-time updates
   */
  public createWebSocket(path: string): WebSocket {
    const url = `${this.config.wsBaseUrl}${path}`;
    const ws = new WebSocket(url);
    
    // Add auth token if available
    if (this.authToken) {
      ws.onopen = () => {
        ws.send(JSON.stringify({ 
          type: 'auth', 
          token: this.authToken 
        }));
      };
    }
    
    return ws;
  }
  
  /**
   * CRDT-Specific API: Sync parcel notes
   */
  public async syncParcelNotes(parcelId: string, update: string): Promise<{
    mergedUpdate: string;
    data: any;
  }> {
    return this.post<{ mergedUpdate: string; data: any }>(
      `/api/sync/parcels/${parcelId}/notes`, 
      { update }
    );
  }
  
  /**
   * CRDT-Specific API: Get current parcel notes state
   */
  public async getParcelNotes(parcelId: string): Promise<{
    update: string;
    data: any;
  }> {
    return this.get<{ update: string; data: any }>(
      `/api/sync/parcels/${parcelId}/notes`
    );
  }
  
  /**
   * CRDT-Specific API: Sync photos for a report
   */
  public async syncReportPhotos(reportId: string, update: string): Promise<{
    mergedUpdate: string;
    photos: any[];
  }> {
    return this.post<{ mergedUpdate: string; photos: any[] }>(
      `/api/sync/reports/${reportId}/photos`, 
      { update }
    );
  }
  
  /**
   * CRDT-Specific API: Get current photos state for a report
   */
  public async getReportPhotos(reportId: string): Promise<{
    update: string;
    photos: any[];
  }> {
    return this.get<{ update: string; photos: any[] }>(
      `/api/sync/reports/${reportId}/photos`
    );
  }
}