import { Platform } from 'react-native';

// Base API URL - should come from environment in a real app
const API_URL = 'https://api.terrafusion.example/v1';

export interface SyncRequest {
  parcelId: string;
  update: string; // Base64 encoded Yjs update
}

export interface SyncResponse {
  update: string; // Base64 encoded merged state
  timestamp: string;
}

class ApiService {
  private token: string | null = null;
  
  /**
   * Set the authentication token for API requests
   */
  setToken(token: string) {
    this.token = token;
  }
  
  /**
   * Get the headers for API requests
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': `TerraField-Mobile/${Platform.OS}`,
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
    };
  }
  
  /**
   * Send a sync request to the server
   */
  async syncParcelNote(req: SyncRequest): Promise<SyncResponse> {
    try {
      const response = await fetch(`${API_URL}/mobile-sync`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(req),
      });
      
      if (!response.ok) {
        if (response.status === 402) {
          throw new Error('Subscription required for mobile sync');
        }
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();