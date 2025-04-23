import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiBaseUrl } from '../config';

// Storage keys
const AUTH_TOKEN_KEY = 'terrafield_auth_token';
const USER_DATA_KEY = 'terrafield_user_data';

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

class AuthService {
  private state: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
    error: null
  };

  private stateListeners: ((state: AuthState) => void)[] = [];

  constructor() {
    // Initialize by loading saved auth state
    this.loadAuthState();
  }

  /**
   * Subscribe to auth state changes
   */
  public subscribe(listener: (state: AuthState) => void): () => void {
    this.stateListeners.push(listener);
    
    // Immediately notify listener of current state
    listener(this.state);
    
    // Return unsubscribe function
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== listener);
    };
  }

  /**
   * Update the auth state and notify listeners
   */
  private setState(updates: Partial<AuthState>) {
    this.state = { ...this.state, ...updates };
    
    // Notify all listeners
    this.stateListeners.forEach(listener => listener(this.state));
  }

  /**
   * Load saved auth state from AsyncStorage
   */
  private async loadAuthState() {
    try {
      this.setState({ isLoading: true, error: null });
      
      // Load token and user data from storage
      const [tokenData, userData] = await Promise.all([
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        AsyncStorage.getItem(USER_DATA_KEY)
      ]);
      
      if (tokenData && userData) {
        const token = tokenData;
        const user = JSON.parse(userData) as User;
        
        // Validate token with server
        const isValid = await this.validateToken(token);
        
        if (isValid) {
          this.setState({ 
            isAuthenticated: true, 
            token, 
            user, 
            isLoading: false 
          });
          return;
        }
      }
      
      // If we get here, either no saved data or invalid token
      this.setState({ 
        isAuthenticated: false, 
        token: null, 
        user: null, 
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to load auth state:', error);
      this.setState({ 
        isAuthenticated: false, 
        isLoading: false, 
        error: 'Failed to load authentication state' 
      });
    }
  }

  /**
   * Validate the token with the server
   */
  private async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  /**
   * Login user with username/email and password
   */
  public async login(usernameOrEmail: string, password: string): Promise<boolean> {
    try {
      this.setState({ isLoading: true, error: null });
      
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usernameOrEmail,
          password
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Authentication failed');
      }
      
      const data = await response.json();
      
      // Save auth data to storage
      await Promise.all([
        AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token),
        AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user))
      ]);
      
      this.setState({
        isAuthenticated: true,
        token: data.token,
        user: data.user,
        isLoading: false
      });
      
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      this.setState({ 
        isLoading: false, 
        error: error.message || 'Authentication failed' 
      });
      return false;
    }
  }

  /**
   * Logout the current user
   */
  public async logout(): Promise<void> {
    try {
      // Clear stored auth data
      await Promise.all([
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_DATA_KEY)
      ]);
      
      // If we have a token, notify the server
      if (this.state.token) {
        try {
          await fetch(`${apiBaseUrl}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.state.token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (e) {
          // Ignore server errors during logout
          console.warn('Error notifying server about logout:', e);
        }
      }
    } finally {
      // Update state regardless of server response
      this.setState({
        isAuthenticated: false,
        token: null,
        user: null,
        error: null
      });
    }
  }

  /**
   * Get the current auth token
   */
  public getToken(): string | null {
    return this.state.token;
  }

  /**
   * Get the current authenticated user
   */
  public getUser(): User | null {
    return this.state.user;
  }

  /**
   * Check if the user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.state.isAuthenticated && !!this.state.token;
  }
}

// Create singleton instance
export const authService = new AuthService();