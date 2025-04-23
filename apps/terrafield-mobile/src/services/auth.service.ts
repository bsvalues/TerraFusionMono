import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../config';
import ApiService from './api.service';

// User interface
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  token?: string;
}

// Authentication state
interface AuthState {
  user: User | null;
  token: string | null;
  authenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  authenticated: false,
  loading: false,
  error: null
};

// Current auth state
let authState = { ...initialState };

// Event listeners
const listeners: Array<(state: AuthState) => void> = [];

/**
 * Subscribe to auth state changes
 */
export function subscribeToAuth(listener: (state: AuthState) => void): () => void {
  listeners.push(listener);
  
  // Call the listener immediately with current state
  listener({ ...authState });
  
  // Return unsubscribe function
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * Update auth state and notify listeners
 */
function updateAuthState(newState: Partial<AuthState>) {
  authState = {
    ...authState,
    ...newState
  };
  
  // Notify all listeners
  listeners.forEach(listener => listener({ ...authState }));
}

/**
 * Initialize auth state from storage
 */
export async function initializeAuth(): Promise<AuthState> {
  try {
    updateAuthState({ loading: true, error: null });
    
    // Get stored token
    const token = await AsyncStorage.getItem('auth_token');
    
    if (!token) {
      updateAuthState({ loading: false });
      return authState;
    }
    
    // Validate token with server
    const response = await ApiService.validateToken();
    
    if (response.error) {
      // Token is invalid, clear it
      await AsyncStorage.removeItem('auth_token');
      updateAuthState({ 
        loading: false, 
        authenticated: false,
        user: null,
        token: null
      });
      return authState;
    }
    
    // Token is valid, update state
    updateAuthState({
      loading: false,
      authenticated: true,
      user: response.data?.user || null,
      token
    });
    
    return authState;
  } catch (error: any) {
    console.error('Auth initialization error:', error);
    updateAuthState({ 
      loading: false, 
      error: error.message || 'Failed to initialize authentication' 
    });
    return authState;
  }
}

/**
 * Login user
 */
export async function login(username: string, password: string): Promise<AuthState> {
  try {
    updateAuthState({ loading: true, error: null });
    
    // Call login API
    const response = await ApiService.login(username, password);
    
    if (response.error) {
      updateAuthState({ 
        loading: false, 
        error: response.error 
      });
      return authState;
    }
    
    // Get user data and token
    const userData = response.data;
    const token = userData?.token;
    
    if (!token) {
      updateAuthState({ 
        loading: false, 
        error: 'No token received from server' 
      });
      return authState;
    }
    
    // Store token
    await AsyncStorage.setItem('auth_token', token);
    
    // Update state
    updateAuthState({
      loading: false,
      authenticated: true,
      user: userData,
      token
    });
    
    return authState;
  } catch (error: any) {
    console.error('Login error:', error);
    updateAuthState({ 
      loading: false, 
      error: error.message || 'Login failed' 
    });
    return authState;
  }
}

/**
 * Register new user
 */
export async function register(username: string, email: string, password: string): Promise<AuthState> {
  try {
    updateAuthState({ loading: true, error: null });
    
    // Call register API
    const response = await ApiService.register(username, email, password);
    
    if (response.error) {
      updateAuthState({ 
        loading: false, 
        error: response.error 
      });
      return authState;
    }
    
    // Get user data and token
    const userData = response.data;
    const token = userData?.token;
    
    if (!token) {
      updateAuthState({ 
        loading: false, 
        error: 'No token received from server' 
      });
      return authState;
    }
    
    // Store token
    await AsyncStorage.setItem('auth_token', token);
    
    // Update state
    updateAuthState({
      loading: false,
      authenticated: true,
      user: userData,
      token
    });
    
    return authState;
  } catch (error: any) {
    console.error('Registration error:', error);
    updateAuthState({ 
      loading: false, 
      error: error.message || 'Registration failed' 
    });
    return authState;
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    // Remove token from storage
    await AsyncStorage.removeItem('auth_token');
    
    // Reset auth state
    updateAuthState({
      user: null,
      token: null,
      authenticated: false,
      loading: false,
      error: null
    });
    
    // Call logout API (optional, as JWT tokens can't be invalidated)
    await ApiService.logout?.();
  } catch (error: any) {
    console.error('Logout error:', error);
    // Still reset the state even if API call fails
    updateAuthState({
      user: null,
      token: null,
      authenticated: false,
      loading: false
    });
  }
}

/**
 * Get current authentication state
 */
export function getAuthState(): AuthState {
  return { ...authState };
}

/**
 * Auth service object
 */
export const AuthService = {
  initializeAuth,
  login,
  register,
  logout,
  getAuthState,
  subscribeToAuth
};

export default AuthService;