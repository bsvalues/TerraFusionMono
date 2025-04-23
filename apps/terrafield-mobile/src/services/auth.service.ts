import { saveUser, getUser, deleteUser } from '../utils/realm';
import apiService from './api.service';
import Config from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Keys for secure storage
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

// User interface
export interface User {
  id: number;
  username: string;
  email?: string;
  role: string;
}

// Login credentials interface
export interface LoginCredentials {
  username: string;
  password: string;
}

// Registration data interface
export interface RegistrationData {
  username: string;
  password: string;
  email?: string;
}

// Auth state interface
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

/**
 * Authentication service for managing user login, registration, and token handling
 */
export class AuthService {
  private static instance: AuthService;
  
  // Auth state
  private _state: AuthState = {
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
  };
  
  // State change callbacks
  private stateChangeCallbacks: Array<(state: AuthState) => void> = [];
  
  // Token refresh timeout
  private refreshTimeout: any = null;
  private readonly TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes before expiry
  
  // Private constructor for singleton pattern
  private constructor() {
    // Initialize auth state
    this.initialize();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize auth state from storage
   */
  private async initialize(): Promise<void> {
    try {
      // Check for stored user
      const storedUser = await this.loadUserFromStorage();
      
      if (storedUser) {
        const token = await this.getToken();
        if (token) {
          this._state = {
            isAuthenticated: true,
            user: storedUser,
            loading: false,
            error: null,
          };
          
          // Schedule token refresh if needed
          this.scheduleTokenRefresh();
        } else {
          // Token missing, user needs to login again
          this._state = {
            isAuthenticated: false,
            user: null,
            loading: false,
            error: null,
          };
        }
      } else {
        // No stored user
        this._state = {
          isAuthenticated: false,
          user: null,
          loading: false,
          error: null,
        };
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      this._state = {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: 'Failed to initialize authentication',
      };
    }
    
    this.notifyStateChange();
  }

  /**
   * Log in a user with credentials
   */
  public async login(credentials: LoginCredentials): Promise<User> {
    try {
      this.updateState({ loading: true, error: null });
      
      // Call login API
      const response = await apiService.request<any>('/api/mobile/auth/login', {
        method: 'POST',
        body: credentials,
        requiresAuth: false,
      });
      
      if (!response.token || !response.user) {
        throw new Error('Invalid response from login API');
      }
      
      // Store tokens securely
      await this.saveTokens(response.token, response.refreshToken);
      
      // Store user info
      const user: User = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        role: response.user.role,
      };
      
      // Store in Realm for offline usage
      await saveUser({ ...user, token: response.token });
      
      // Update state
      this.updateState({
        isAuthenticated: true,
        user,
        loading: false,
        error: null,
      });
      
      // Set up token refresh
      this.scheduleTokenRefresh();
      
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      this.updateState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: errorMessage,
      });
      
      throw error;
    }
  }

  /**
   * Register a new user
   */
  public async register(data: RegistrationData): Promise<User> {
    try {
      this.updateState({ loading: true, error: null });
      
      // Call register API
      const response = await apiService.request<any>('/api/mobile/auth/register', {
        method: 'POST',
        body: data,
        requiresAuth: false,
      });
      
      if (!response.token || !response.user) {
        throw new Error('Invalid response from registration API');
      }
      
      // Store tokens securely
      await this.saveTokens(response.token, response.refreshToken);
      
      // Store user info
      const user: User = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        role: response.user.role,
      };
      
      // Store in Realm for offline usage
      await saveUser({ ...user, token: response.token });
      
      // Update state
      this.updateState({
        isAuthenticated: true,
        user,
        loading: false,
        error: null,
      });
      
      // Set up token refresh
      this.scheduleTokenRefresh();
      
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      
      this.updateState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: errorMessage,
      });
      
      throw error;
    }
  }

  /**
   * Log out the current user
   */
  public async logout(): Promise<void> {
    try {
      // Clear refresh timeout
      if (this.refreshTimeout) {
        clearTimeout(this.refreshTimeout);
        this.refreshTimeout = null;
      }
      
      // Attempt to call logout API if online
      try {
        await apiService.request('/api/mobile/auth/logout', {
          method: 'POST',
          bypassOfflineQueue: true,
        });
      } catch (error) {
        // Ignore errors from logout API
        console.log('Logout API error (ignored):', error);
      }
      
      // Clear tokens and user data
      await this.clearTokens();
      await deleteUser();
      
      // Update state
      this.updateState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      
      // Ensure state is reset even if there's an error
      this.updateState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: 'Logout failed',
      });
    }
  }

  /**
   * Get the current authentication token
   */
  public async getToken(): Promise<string | null> {
    try {
      // First try secure storage
      let token = await this.getSecureValue(TOKEN_KEY);
      
      // If not in secure storage, try AsyncStorage
      if (!token) {
        token = await AsyncStorage.getItem(TOKEN_KEY);
      }
      
      // If still no token, try Realm
      if (!token) {
        const user = await getUser();
        token = user?.token || null;
      }
      
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  /**
   * Refresh the authentication token
   */
  public async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await this.getSecureValue(REFRESH_TOKEN_KEY);
      
      if (!refreshToken) {
        console.error('No refresh token available');
        return false;
      }
      
      // Call token refresh API
      const response = await apiService.request<any>('/api/mobile/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
        requiresAuth: false,
        bypassOfflineQueue: true,
      });
      
      if (!response.token) {
        throw new Error('Invalid response from token refresh API');
      }
      
      // Store new tokens
      await this.saveTokens(response.token, response.refreshToken || refreshToken);
      
      // Update user in Realm if we have current user
      if (this._state.user) {
        await saveUser({ ...this._state.user, token: response.token });
      }
      
      // Reschedule token refresh
      this.scheduleTokenRefresh();
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      
      // If refresh fails, user needs to login again
      this.updateState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: 'Session expired, please login again',
      });
      
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this._state.isAuthenticated;
  }

  /**
   * Get current user
   */
  public getCurrentUser(): User | null {
    return this._state.user;
  }

  /**
   * Get current authentication state
   */
  public getState(): AuthState {
    return { ...this._state };
  }

  /**
   * Schedule token refresh based on expiry
   */
  private scheduleTokenRefresh(): void {
    // Clear any existing timeout
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
    
    // Schedule refresh
    // For simplicity, refresh every 6 hours
    // In a production app, parse JWT expiry and schedule accordingly
    const refreshTime = 6 * 60 * 60 * 1000; // 6 hours
    
    this.refreshTimeout = setTimeout(() => {
      this.refreshToken();
    }, refreshTime - this.TOKEN_REFRESH_BUFFER);
  }

  /**
   * Update auth state and notify listeners
   */
  private updateState(updates: Partial<AuthState>): void {
    this._state = { ...this._state, ...updates };
    this.notifyStateChange();
  }

  /**
   * Notify state change to all listeners
   */
  private notifyStateChange(): void {
    this.stateChangeCallbacks.forEach(callback => callback(this._state));
  }

  /**
   * Register for state change notifications
   */
  public onStateChange(callback: (state: AuthState) => void): () => void {
    this.stateChangeCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.stateChangeCallbacks = this.stateChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Save tokens to secure storage
   */
  private async saveTokens(token: string, refreshToken?: string): Promise<void> {
    try {
      // Try to use secure storage first
      const tokenSaved = await this.saveSecureValue(TOKEN_KEY, token);
      
      // Fall back to AsyncStorage if secure storage fails
      if (!tokenSaved) {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      }
      
      // Save refresh token if provided
      if (refreshToken) {
        await this.saveSecureValue(REFRESH_TOKEN_KEY, refreshToken);
      }
    } catch (error) {
      console.error('Error saving tokens:', error);
      throw error;
    }
  }

  /**
   * Clear tokens from storage
   */
  private async clearTokens(): Promise<void> {
    try {
      // Clear from secure storage
      await this.deleteSecureValue(TOKEN_KEY);
      await this.deleteSecureValue(REFRESH_TOKEN_KEY);
      
      // Also clear from AsyncStorage as fallback
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error clearing tokens:', error);
      throw error;
    }
  }

  /**
   * Load user from storage
   */
  private async loadUserFromStorage(): Promise<User | null> {
    try {
      // Try to get from Realm first
      const user = await getUser();
      if (user) {
        return user;
      }
      
      // Try AsyncStorage as fallback
      const userJson = await AsyncStorage.getItem(USER_KEY);
      if (userJson) {
        return JSON.parse(userJson);
      }
      
      return null;
    } catch (error) {
      console.error('Error loading user from storage:', error);
      return null;
    }
  }

  /**
   * Save value to secure storage
   */
  private async saveSecureValue(key: string, value: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // Web doesn't support SecureStore
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
      return true;
    } catch (error) {
      console.error(`Error saving secure value for ${key}:`, error);
      return false;
    }
  }

  /**
   * Get value from secure storage
   */
  private async getSecureValue(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // Web doesn't support SecureStore
        return await AsyncStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error(`Error getting secure value for ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete value from secure storage
   */
  private async deleteSecureValue(key: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // Web doesn't support SecureStore
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
      return true;
    } catch (error) {
      console.error(`Error deleting secure value for ${key}:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

export default authService;