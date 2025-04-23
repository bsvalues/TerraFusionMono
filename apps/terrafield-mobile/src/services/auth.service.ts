import { BehaviorSubject } from 'rxjs';
import Config from '../config';

interface AuthState {
  isAuthenticated: boolean;
  userId?: number;
  username?: string;
}

interface LoginData {
  username: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

interface AuthTokens {
  token: string;
  refreshToken: string;
  expiresAt: number;
}

/**
 * Authentication service for managing user authentication state
 */
class AuthService {
  private _authState = new BehaviorSubject<AuthState>({ isAuthenticated: false });
  private _tokens: AuthTokens | null = null;
  private _currentUser: UserData | null = null;

  /**
   * Observable for auth state changes
   */
  public get authState$() {
    return this._authState.asObservable();
  }

  /**
   * Login with username and password
   */
  public async login(data: LoginData): Promise<UserData> {
    try {
      // In a real implementation, this would make an API request
      // For now, we'll simulate a successful login with mock data
      
      const response = await fetch(`${Config.API.BASE_URL}/api/mobile/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const responseData = await response.json();
      
      // Store authentication tokens
      this._tokens = {
        token: responseData.token,
        refreshToken: responseData.refreshToken,
        expiresAt: Date.now() + (responseData.expiresIn * 1000 || Config.AUTH.SESSION_TIMEOUT),
      };
      
      // Store user information
      this._currentUser = responseData.user;
      
      // Save tokens and user info to secure storage
      await this.persistAuthState();
      
      // Update authentication state
      this._authState.next({
        isAuthenticated: true,
        userId: responseData.user.id,
        username: responseData.user.username,
      });
      
      return responseData.user;
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Register a new user
   */
  public async register(data: RegisterData): Promise<UserData> {
    try {
      // In a real implementation, this would make an API request
      // For now, we'll simulate a successful registration with mock data
      
      const response = await fetch(`${Config.API.BASE_URL}/api/mobile/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const responseData = await response.json();
      
      // Store authentication tokens
      this._tokens = {
        token: responseData.token,
        refreshToken: responseData.refreshToken,
        expiresAt: Date.now() + (responseData.expiresIn * 1000 || Config.AUTH.SESSION_TIMEOUT),
      };
      
      // Store user information
      this._currentUser = responseData.user;
      
      // Save tokens and user info to secure storage
      await this.persistAuthState();
      
      // Update authentication state
      this._authState.next({
        isAuthenticated: true,
        userId: responseData.user.id,
        username: responseData.user.username,
      });
      
      return responseData.user;
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  }

  /**
   * Logout the current user
   */
  public async logout(): Promise<void> {
    try {
      // In a real implementation, this might call an API endpoint
      // to invalidate the token on the server
      
      // Clear auth state
      this._tokens = null;
      this._currentUser = null;
      
      // Clear persisted auth state
      await this.clearAuthState();
      
      // Update authentication state
      this._authState.next({ isAuthenticated: false });
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Logout failed');
    }
  }

  /**
   * Check if the user is authenticated
   */
  public isAuthenticated(): boolean {
    if (!this._tokens) {
      return false;
    }
    
    // Check if token is expired
    return Date.now() < this._tokens.expiresAt;
  }

  /**
   * Get the current authentication token
   */
  public async getToken(): Promise<string | null> {
    // If token is expired, try to refresh
    if (this._tokens && Date.now() >= this._tokens.expiresAt) {
      try {
        await this.refreshToken();
      } catch (error) {
        return null;
      }
    }
    
    return this._tokens?.token || null;
  }

  /**
   * Refresh the authentication token
   */
  public async refreshToken(): Promise<boolean> {
    if (!this._tokens?.refreshToken) {
      return false;
    }
    
    try {
      // In a real implementation, this would make an API request
      // For now, we'll simulate a successful token refresh
      
      const response = await fetch(`${Config.API.BASE_URL}/api/mobile/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: this._tokens.refreshToken,
        }),
      });
      
      if (!response.ok) {
        // If refresh token is invalid, logout
        await this.logout();
        return false;
      }
      
      const responseData = await response.json();
      
      // Update tokens
      this._tokens = {
        token: responseData.token,
        refreshToken: responseData.refreshToken || this._tokens.refreshToken,
        expiresAt: Date.now() + (responseData.expiresIn * 1000 || Config.AUTH.SESSION_TIMEOUT),
      };
      
      // Save updated tokens
      await this.persistAuthState();
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.logout();
      return false;
    }
  }

  /**
   * Get the current user data
   */
  public getCurrentUser(): UserData | null {
    return this._currentUser;
  }

  /**
   * Save authentication state to secure storage
   */
  private async persistAuthState(): Promise<void> {
    // In a real implementation, this would save tokens to secure storage
    // and user data to regular storage
    // For now, we'll just log that it would be saved
    console.log('Would save auth state to secure storage');
  }

  /**
   * Clear authentication state from secure storage
   */
  private async clearAuthState(): Promise<void> {
    // In a real implementation, this would clear tokens from secure storage
    // and user data from regular storage
    // For now, we'll just log that it would be cleared
    console.log('Would clear auth state from secure storage');
  }

  /**
   * Load authentication state from secure storage
   * Called during app initialization
   */
  public async loadAuthState(): Promise<boolean> {
    // In a real implementation, this would load tokens from secure storage
    // and user data from regular storage
    // For now, we'll just return false (not authenticated)
    return false;
  }
}

const authService = new AuthService();
export default authService;