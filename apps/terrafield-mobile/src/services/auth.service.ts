import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const TOKEN_KEY = 'terrafield_auth_token';
const USER_KEY = 'terrafield_user';

// User interface
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  organization?: string;
}

// Auth service for user authentication
class AuthService {
  private token: string | null = null;
  private user: User | null = null;
  private apiUrl = 'https://api.terrafusion.example/v1';
  
  /**
   * Initialize the auth service by loading saved credentials
   */
  async initialize(): Promise<boolean> {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const userJson = await AsyncStorage.getItem(USER_KEY);
      
      if (token && userJson) {
        this.token = token;
        this.user = JSON.parse(userJson);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error initializing auth service:', error);
      return false;
    }
  }
  
  /**
   * Get the current authentication token
   */
  getToken(): string | null {
    return this.token;
  }
  
  /**
   * Get the current authenticated user
   */
  getUser(): User | null {
    return this.user;
  }
  
  /**
   * Check if the user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }
  
  /**
   * Get the headers for API requests
   */
  getAuthHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': `TerraField-Mobile/${Platform.OS}`,
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
    };
  }
  
  /**
   * Login with username and password
   */
  async login(username: string, password: string): Promise<User> {
    try {
      const response = await fetch(`${this.apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': `TerraField-Mobile/${Platform.OS}`,
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const data = await response.json();
      this.token = data.token;
      this.user = data.user;
      
      // Save to storage
      await AsyncStorage.setItem(TOKEN_KEY, this.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(this.user));
      
      return this.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  /**
   * Register a new user
   */
  async register(userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    organization?: string;
  }): Promise<User> {
    try {
      const response = await fetch(`${this.apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': `TerraField-Mobile/${Platform.OS}`,
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const data = await response.json();
      this.token = data.token;
      this.user = data.user;
      
      // Save to storage
      await AsyncStorage.setItem(TOKEN_KEY, this.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(this.user));
      
      return this.user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
  
  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    try {
      if (this.token) {
        // Attempt to notify server of logout (best effort)
        try {
          await fetch(`${this.apiUrl}/auth/logout`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
          });
        } catch (e) {
          // Ignore server errors on logout
          console.log('Server logout error (ignoring):', e);
        }
      }
      
      // Clear local state
      this.token = null;
      this.user = null;
      
      // Clear from storage
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
  
  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': `TerraField-Mobile/${Platform.OS}`,
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password reset failed');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }
  
  /**
   * Update user profile information
   */
  async updateProfile(updates: Partial<Omit<User, 'id'>>): Promise<User> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/users/profile`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Profile update failed');
      }
      
      const updatedUser = await response.json();
      this.user = updatedUser;
      
      // Update storage
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(this.user));
      
      return this.user;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }
  
  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }
    
    try {
      const response = await fetch(`${this.apiUrl}/auth/change-password`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password change failed');
      }
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const authService = new AuthService();