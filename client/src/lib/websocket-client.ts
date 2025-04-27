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

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface ConnectionStatusChangeEvent {
  status: ConnectionStatus;
  timestamp: number;
  attempt?: number;
  code?: number;
  reason?: string;
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
   * Automatic reconnection on connection close or error
   */
  autoReconnect?: boolean;
  
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
  
  /**
   * Optional callback for connection status changes
   */
  onStatusChange?: (event: ConnectionStatusChangeEvent) => void;
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
  private autoReconnect: boolean;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private token: string | undefined;
  private clientId: string | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private sessionId: string | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private connectionStartTime: number = 0;
  private lastMessageTime: number = 0;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatMissed = 0;
  private heartbeatThreshold = 3; // Number of missed heartbeats before attempting reconnection
  
  // Callbacks
  private onConnectCallback: (() => void) | undefined;
  private onDisconnectCallback: ((event: CloseEvent) => void) | undefined;
  private onErrorCallback: ((error: Event) => void) | undefined;
  private onMessageCallback: ((message: WebSocketMessage) => void) | undefined;
  private onStatusChangeCallback: ((event: ConnectionStatusChangeEvent) => void) | undefined;
  
  // Event listeners
  private messageListeners: Map<string, ((message: WebSocketMessage) => void)[]> = new Map();
  
  constructor(options: WebSocketOptions) {
    this.url = options.url;
    this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
    this.reconnectDelay = options.reconnectDelay || 1000;
    this.useExponentialBackoff = options.useExponentialBackoff !== false;
    this.autoReconnect = options.autoReconnect !== false;
    this.token = options.token;
    
    this.onConnectCallback = options.onConnect;
    this.onDisconnectCallback = options.onDisconnect;
    this.onErrorCallback = options.onError;
    this.onMessageCallback = options.onMessage;
    this.onStatusChangeCallback = options.onStatusChange;
    
    // Don't connect automatically - call connect() when ready
  }
  
  /**
   * Update the connection status and trigger the onStatusChange callback
   */
  private _updateConnectionStatus(status: ConnectionStatus, code?: number, reason?: string): void {
    // Only trigger callback if status actually changed
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      
      const statusEvent: ConnectionStatusChangeEvent = {
        status,
        timestamp: Date.now(),
        attempt: status === 'reconnecting' ? this.reconnectAttempts : undefined,
        code,
        reason
      };
      
      // Log the status change
      console.log(`WebSocket connection status changed to ${status}`, statusEvent);
      
      // Invoke the status change callback if provided
      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(statusEvent);
      }
    }
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
    this.connectionStartTime = Date.now();
    this._updateConnectionStatus('connecting');
    this._connect();
  }
  
  /**
   * Internal connect method with reconnection logic
   */
  private _connect(): void {
    try {
      console.log(`Connecting to WebSocket server at ${this.url}`);
      
      // Update status to connecting if not already
      if (this.connectionStatus !== 'connecting') {
        this._updateConnectionStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');
      }
      
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = this._handleOpen.bind(this);
      this.ws.onclose = this._handleClose.bind(this);
      this.ws.onerror = this._handleError.bind(this);
      this.ws.onmessage = this._handleMessage.bind(this);
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this._updateConnectionStatus('error');
      this._scheduleReconnect();
    }
  }
  
  /**
   * Handle WebSocket open event
   */
  private _handleOpen(): void {
    console.log('WebSocket connection established');
    
    this.reconnectAttempts = 0;
    this._updateConnectionStatus('connected');
    this.connectionStartTime = Date.now();
    this.lastMessageTime = Date.now();
    
    // If we have a token, authenticate immediately
    if (this.token) {
      this.authenticate(this.token);
    }
    
    // Process any queued messages
    this._processQueue();
    
    // Start the heartbeat process
    this._startHeartbeat();
    
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
    
    // Stop the heartbeat process
    this._stopHeartbeat();
    
    // Update the connection status
    this._updateConnectionStatus('disconnected', event.code, event.reason);
    
    // Call the onDisconnect callback if provided
    if (this.onDisconnectCallback) {
      this.onDisconnectCallback(event);
    }
    
    // Don't reconnect if the closure was clean (code 1000) or autoReconnect is disabled
    if (event.code !== 1000 && this.autoReconnect) {
      this._scheduleReconnect();
    }
  }
  
  /**
   * Handle WebSocket error event
   */
  private _handleError(error: Event): void {
    console.error('WebSocket error:', error);
    
    // Update the connection status
    this._updateConnectionStatus('error');
    
    // Call the onError callback if provided
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }
  }
  
  /**
   * Start the heartbeat process to detect connection issues
   */
  private _startHeartbeat(): void {
    // Clear any existing interval
    this._stopHeartbeat();
    
    // Set up a ping interval (every 30 seconds)
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        // Send a ping message
        this.send({ type: 'ping', timestamp: Date.now() });
      } else {
        // Connection is not open but interval is running - attempt reconnect
        this.heartbeatMissed++;
        
        if (this.heartbeatMissed >= this.heartbeatThreshold) {
          console.log(`Missed ${this.heartbeatMissed} heartbeats, attempting reconnection`);
          this._scheduleReconnect();
        }
      }
    }, 30000); // 30 second interval
  }
  
  /**
   * Stop the heartbeat process
   */
  private _stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
  
  /**
   * Handle WebSocket message event
   */
  private _handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      // Update last message time and reset heartbeat missed counter
      this.lastMessageTime = Date.now();
      this.heartbeatMissed = 0;
      
      console.log(`Received message of type: ${message.type}`);
      
      // Handle welcome message to capture clientId
      if (message.type === 'welcome' && message.clientId) {
        this.clientId = message.clientId;
        console.log(`Received client ID: ${this.clientId}`);
      }
      
      // Handle pong messages for connection health monitoring
      if (message.type === 'pong') {
        // Calculate round-trip time if we have the original ping timestamp
        if (message.originalTimestamp) {
          const rtt = Date.now() - message.originalTimestamp;
          console.log(`WebSocket ping-pong round-trip time: ${rtt}ms`);
        }
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
   * Get current connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }
  
  /**
   * Get connection metrics - uptime, reconnection attempts, etc.
   */
  public getConnectionMetrics(): {
    status: ConnectionStatus;
    uptime: number;
    reconnectAttempts: number;
    lastMessageTime: number;
  } {
    const now = Date.now();
    const uptime = this.connectionStartTime ? now - this.connectionStartTime : 0;
    
    return {
      status: this.connectionStatus,
      uptime: uptime,
      reconnectAttempts: this.reconnectAttempts,
      lastMessageTime: this.lastMessageTime
    };
  }
  
  /**
   * Close the WebSocket connection
   */
  public disconnect(code?: number, reason?: string): void {
    // Stop the heartbeat process
    this._stopHeartbeat();
    
    // Clear the reconnect timeout
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
    
    // Update connection status
    this._updateConnectionStatus('disconnected', code, reason);
    
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
    const [connectionStatus, setConnectionStatus] = React.useState<ConnectionStatus>('disconnected');
    const [messages, setMessages] = React.useState<WebSocketMessage[]>([]);
    const [connectionMetrics, setConnectionMetrics] = React.useState<{
      uptime: number;
      reconnectAttempts: number;
      lastMessageTime: number;
    }>({
      uptime: 0,
      reconnectAttempts: 0,
      lastMessageTime: 0
    });
    
    // Update metrics on an interval
    React.useEffect(() => {
      if (!wsRef.current) return;
      
      const intervalId = setInterval(() => {
        if (wsRef.current) {
          const metrics = wsRef.current.getConnectionMetrics();
          setConnectionMetrics({
            uptime: metrics.uptime,
            reconnectAttempts: metrics.reconnectAttempts,
            lastMessageTime: metrics.lastMessageTime
          });
        }
      }, 1000);
      
      return () => clearInterval(intervalId);
    }, [wsRef.current]);
    
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
        autoReconnect: true,
        onConnect: () => setConnectionStatus('connected'),
        onDisconnect: () => setConnectionStatus('disconnected'),
        onStatusChange: (event) => {
          setConnectionStatus(event.status);
        },
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
    
    const isConnected = connectionStatus === 'connected';
    
    return {
      isConnected,
      connectionStatus,
      connectionMetrics,
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
      disconnect: () => wsRef.current?.disconnect(),
      getConnectionStatus: () => wsRef.current?.getConnectionStatus() || 'disconnected',
      getConnectionMetrics: () => wsRef.current?.getConnectionMetrics() || {
        status: 'disconnected' as ConnectionStatus,
        uptime: 0,
        reconnectAttempts: 0,
        lastMessageTime: 0
      }
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