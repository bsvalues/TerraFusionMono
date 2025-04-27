/**
 * WebSocket Client for TerraFusion
 * 
 * This module provides a robust WebSocket client with automatic reconnection,
 * message handling, and session management for real-time collaboration features.
 */

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface WebSocketOptions {
  /**
   * The URL of the WebSocket server
   */
  url: string;
  
  /**
   * Maximum number of reconnection attempts
   */
  maxReconnectAttempts?: number;
  
  /**
   * Base delay in milliseconds between reconnection attempts
   */
  reconnectDelay?: number;
  
  /**
   * Whether to use exponential backoff for reconnections
   */
  useExponentialBackoff?: boolean;
  
  /**
   * Authentication token
   */
  token?: string;
  
  /**
   * Optional callback when connection is established
   */
  onConnect?: () => void;
  
  /**
   * Optional callback when connection is closed
   */
  onDisconnect?: (event: CloseEvent) => void;
  
  /**
   * Optional callback when connection error occurs
   */
  onError?: (error: Event) => void;
  
  /**
   * Optional callback for WebSocket messages
   */
  onMessage?: (message: WebSocketMessage) => void;
}

/**
 * WebSocket client with automatic reconnection and message handling
 */
class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private maxReconnectAttempts: number;
  private reconnectDelay: number;
  private useExponentialBackoff: boolean;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private token: string | undefined;
  private clientId: string | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private sessionId: string | null = null;
  
  // Callbacks
  private onConnectCallback: (() => void) | undefined;
  private onDisconnectCallback: ((event: CloseEvent) => void) | undefined;
  private onErrorCallback: ((error: Event) => void) | undefined;
  private onMessageCallback: ((message: WebSocketMessage) => void) | undefined;
  
  // Event listeners
  private messageListeners: Map<string, ((message: WebSocketMessage) => void)[]> = new Map();
  
  constructor(options: WebSocketOptions) {
    this.url = options.url;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.useExponentialBackoff = options.useExponentialBackoff !== false;
    this.token = options.token;
    
    this.onConnectCallback = options.onConnect;
    this.onDisconnectCallback = options.onDisconnect;
    this.onErrorCallback = options.onError;
    this.onMessageCallback = options.onMessage;
    
    // Don't connect automatically - call connect() when ready
  }
  
  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      console.log('WebSocket is already connecting or connected');
      return;
    }
    
    this.reconnectAttempts = 0;
    this._connect();
  }
  
  /**
   * Internal connect method with reconnection logic
   */
  private _connect(): void {
    try {
      console.log(`Connecting to WebSocket server at ${this.url}`);
      
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = this._handleOpen.bind(this);
      this.ws.onclose = this._handleClose.bind(this);
      this.ws.onerror = this._handleError.bind(this);
      this.ws.onmessage = this._handleMessage.bind(this);
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this._scheduleReconnect();
    }
  }
  
  /**
   * Handle WebSocket open event
   */
  private _handleOpen(): void {
    console.log('WebSocket connection established');
    
    this.reconnectAttempts = 0;
    
    // If we have a token, authenticate immediately
    if (this.token) {
      this.authenticate(this.token);
    }
    
    // Process any queued messages
    this._processQueue();
    
    // Call the onConnect callback if provided
    if (this.onConnectCallback) {
      this.onConnectCallback();
    }
  }
  
  /**
   * Handle WebSocket close event
   */
  private _handleClose(event: CloseEvent): void {
    console.log(`WebSocket connection closed: ${event.code}, ${event.reason}`);
    
    // Call the onDisconnect callback if provided
    if (this.onDisconnectCallback) {
      this.onDisconnectCallback(event);
    }
    
    // Don't reconnect if the closure was clean (code 1000)
    if (event.code !== 1000) {
      this._scheduleReconnect();
    }
  }
  
  /**
   * Handle WebSocket error event
   */
  private _handleError(error: Event): void {
    console.error('WebSocket error:', error);
    
    // Call the onError callback if provided
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }
  }
  
  /**
   * Handle WebSocket message event
   */
  private _handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      console.log(`Received message of type: ${message.type}`);
      
      // Handle welcome message to capture clientId
      if (message.type === 'welcome' && message.clientId) {
        this.clientId = message.clientId;
        console.log(`Received client ID: ${this.clientId}`);
      }
      
      // Call type-specific listener callbacks
      const listeners = this.messageListeners.get(message.type);
      if (listeners) {
        listeners.forEach(listener => listener(message));
      }
      
      // Call the general onMessage callback if provided
      if (this.onMessageCallback) {
        this.onMessageCallback(message);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }
  
  /**
   * Schedule reconnection attempt
   */
  private _scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log(`Maximum reconnection attempts (${this.maxReconnectAttempts}) reached. Giving up.`);
      return;
    }
    
    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectAttempts++;
    
    // Calculate delay with exponential backoff if enabled
    let delay = this.reconnectDelay;
    if (this.useExponentialBackoff) {
      // Add jitter to prevent all clients reconnecting simultaneously
      const jitter = Math.random() * 0.3 + 0.8; // 0.8-1.1 multiplier for jitter
      delay = Math.min(30000, delay * Math.pow(1.5, this.reconnectAttempts - 1)) * jitter;
    }
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${Math.round(delay)}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      this._connect();
    }, delay);
  }
  
  /**
   * Process queued messages
   */
  private _processQueue(): void {
    if (!this.isConnected()) {
      return;
    }
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this._sendMessage(message);
      }
    }
  }
  
  /**
   * Send a message to the server
   */
  public send(message: WebSocketMessage): void {
    if (this.isConnected()) {
      this._sendMessage(message);
    } else {
      // Queue the message for sending when connection is established
      this.messageQueue.push(message);
      console.log('Connection not open, message queued');
      
      // Try to reconnect if not already connecting
      if (!this.ws || this.ws.readyState !== WebSocket.CONNECTING) {
        this._connect();
      }
    }
  }
  
  /**
   * Internal method to send a message
   */
  private _sendMessage(message: WebSocketMessage): void {
    if (!this.ws) return;
    
    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message:', error);
      this.messageQueue.push(message);
    }
  }
  
  /**
   * Authenticate with the WebSocket server
   */
  public authenticate(token: string): void {
    this.token = token;
    
    if (this.isConnected()) {
      this.send({
        type: 'auth',
        token
      });
    }
  }
  
  /**
   * Join a collaboration session
   */
  public joinSession(sessionId: string, username?: string): void {
    this.sessionId = sessionId;
    
    this.send({
      type: 'join_session',
      sessionId,
      username
    });
  }
  
  /**
   * Leave the current session
   */
  public leaveSession(): void {
    if (!this.sessionId) {
      return;
    }
    
    this.send({
      type: 'leave_session'
    });
    
    this.sessionId = null;
  }
  
  /**
   * Send a document update
   */
  public sendUpdate(update: string): void {
    if (!this.sessionId) {
      console.error('Cannot send update: Not in a session');
      return;
    }
    
    this.send({
      type: 'update',
      update
    });
  }
  
  /**
   * Send a cursor position update
   */
  public sendCursorUpdate(position: any, selection?: any): void {
    if (!this.sessionId) {
      return;
    }
    
    this.send({
      type: 'cursor',
      position,
      selection
    });
  }
  
  /**
   * Send a presence update
   */
  public sendPresenceUpdate(state: any): void {
    if (!this.sessionId) {
      return;
    }
    
    this.send({
      type: 'presence',
      state
    });
  }
  
  /**
   * Send a comment
   */
  public sendComment(comment: any): void {
    if (!this.sessionId) {
      console.error('Cannot send comment: Not in a session');
      return;
    }
    
    this.send({
      type: 'comment',
      comment
    });
  }
  
  /**
   * Register a listener for a specific message type
   */
  public on(messageType: string, callback: (message: WebSocketMessage) => void): void {
    if (!this.messageListeners.has(messageType)) {
      this.messageListeners.set(messageType, []);
    }
    
    this.messageListeners.get(messageType)?.push(callback);
  }
  
  /**
   * Remove a listener for a specific message type
   */
  public off(messageType: string, callback: (message: WebSocketMessage) => void): void {
    const listeners = this.messageListeners.get(messageType);
    if (!listeners) return;
    
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
    
    if (listeners.length === 0) {
      this.messageListeners.delete(messageType);
    }
  }
  
  /**
   * Check if the WebSocket is connected
   */
  public isConnected(): boolean {
    return !!this.ws && this.ws.readyState === WebSocket.OPEN;
  }
  
  /**
   * Get the current client ID
   */
  public getClientId(): string | null {
    return this.clientId;
  }
  
  /**
   * Get the current session ID
   */
  public getSessionId(): string | null {
    return this.sessionId;
  }
  
  /**
   * Close the WebSocket connection
   */
  public disconnect(code?: number, reason?: string): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      try {
        // Leave any active session
        if (this.sessionId) {
          this.leaveSession();
        }
        
        this.ws.close(code || 1000, reason || 'Client disconnected');
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
      
      this.ws = null;
    }
    
    this.sessionId = null;
    this.clientId = null;
  }
}

/**
 * Create and configure a WebSocket client instance
 */
export function createWebSocketClient(options: WebSocketOptions): WebSocketClient {
  return new WebSocketClient(options);
}

/**
 * WebSocket hook creator for React components
 */
export function createWebSocketHook(baseUrl: string) {
  return function useWebSocket(path: string = '/ws') {
    const wsRef = React.useRef<WebSocketClient | null>(null);
    const [isConnected, setIsConnected] = React.useState(false);
    const [messages, setMessages] = React.useState<WebSocketMessage[]>([]);
    
    React.useEffect(() => {
      // Determine the protocol (ws: or wss:)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      
      // Create the WebSocket URL
      const wsUrl = `${protocol}//${host}${path}`;
      
      // Create a WebSocket client
      const client = createWebSocketClient({
        url: wsUrl,
        maxReconnectAttempts: 5,
        reconnectDelay: 1000,
        useExponentialBackoff: true,
        onConnect: () => setIsConnected(true),
        onDisconnect: () => setIsConnected(false),
        onMessage: (message) => {
          setMessages(prev => [...prev, message]);
        }
      });
      
      // Store the client in a ref
      wsRef.current = client;
      
      // Connect to the WebSocket server
      client.connect();
      
      // Cleanup on unmount
      return () => {
        client.disconnect();
      };
    }, [path]);
    
    return {
      isConnected,
      messages,
      client: wsRef.current,
      send: (message: WebSocketMessage) => wsRef.current?.send(message),
      authenticate: (token: string) => wsRef.current?.authenticate(token),
      joinSession: (sessionId: string, username?: string) => wsRef.current?.joinSession(sessionId, username),
      leaveSession: () => wsRef.current?.leaveSession(),
      sendUpdate: (update: string) => wsRef.current?.sendUpdate(update),
      sendCursorUpdate: (position: any, selection?: any) => wsRef.current?.sendCursorUpdate(position, selection),
      sendPresenceUpdate: (state: any) => wsRef.current?.sendPresenceUpdate(state),
      sendComment: (comment: any) => wsRef.current?.sendComment(comment),
      disconnect: () => wsRef.current?.disconnect()
    };
  };
}

// Import React if the environment is React
let React: any;
try {
  React = require('react');
} catch (e) {
  // Not in a React environment, ignore
}

// Export the React hook if React is available
export const useWebSocket = React ? createWebSocketHook('/ws') : undefined;