/**
 * NATS Client with Robust Reconnection Logic
 * 
 * This file implements a NATS client wrapper with advanced reconnection capabilities,
 * connection tracking, and error handling similar to our WebSocket implementation.
 */

import { connect, NatsConnection, ConnectionOptions, Subscription, SubscriptionOptions, Msg, headers, MsgHdrs } from 'nats';
import { storage } from '../storage';
import { InsertNatsConnection, NatsConnection as NatsConnectionType } from '@shared/schema';
import { log } from '../vite';
import { metricsService } from './metrics';

// Connection status types
export type NatsConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

// Message to be published
export interface NatsMessage {
  subject: string;
  data: any;
  headers?: Record<string, string>;
}

// Pending message during disconnection
interface PendingMessage extends NatsMessage {
  timestamp: number;
  attempts: number;
}

// Storage for subscription callbacks
interface SubscriptionHandler {
  subject: string;
  queue?: string;
  callback: (data: any, headers?: Record<string, string>, msg?: Msg) => void;
}

// Connection config interface
export interface NatsClientOptions {
  servers: string[];
  maxReconnectAttempts?: number;
  reconnectTimeWait?: number;
  useExponentialBackoff?: boolean;
  name?: string;
  token?: string;
  maxPendingMessages?: number;
  pingInterval?: number;
  maxPingTimeout?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: NatsConnectionStatus) => void;
}

/**
 * Enhanced NATS client with robust reconnection logic
 */
export class NatsClient {
  private connection: NatsConnection | null = null;
  private options: NatsClientOptions;
  private connectionStatus: NatsConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private subscriptions: Map<string, Subscription> = new Map();
  private subscriptionHandlers: SubscriptionHandler[] = [];
  private pendingMessages: PendingMessage[] = [];
  private connectionStartTime: number = 0;
  private connectionId: string = '';
  private dbConnectionId: number | null = null;
  private lastPingTime: number = 0;
  private messagesSent: number = 0;
  private messagesReceived: number = 0;
  
  /**
   * Create a new NATS client
   * @param options Configuration options for the NATS client
   */
  constructor(options: NatsClientOptions) {
    this.options = {
      maxReconnectAttempts: 10,
      reconnectTimeWait: 1000,
      useExponentialBackoff: true,
      maxPendingMessages: 1000,
      pingInterval: 30000,
      maxPingTimeout: 5000,
      ...options
    };
  }
  
  /**
   * Connect to the NATS server
   * This is the main entry point to start using the client
   */
  async connect(): Promise<void> {
    if (this.connection) {
      log('Already connected to NATS server', 'nats');
      return;
    }
    
    this._updateConnectionStatus('connecting');
    
    try {
      await this._connect();
    } catch (error) {
      this._updateConnectionStatus('error');
      this._handleError(error as Error);
      this._scheduleReconnect();
      throw error;
    }
  }
  
  /**
   * Internal connection method with error handling
   */
  private async _connect(): Promise<void> {
    try {
      const connectionOptions: ConnectionOptions = {
        servers: this.options.servers,
        name: this.options.name,
        token: this.options.token,
        reconnect: false, // We handle reconnection ourselves
        maxReconnectAttempts: 0,
        pingInterval: this.options.pingInterval,
        maxPingOut: 3,
      };
      
      log(`Connecting to NATS server(s): ${this.options.servers.join(', ')}`, 'nats');
      
      // Reset connection start time
      this.connectionStartTime = Date.now();
      
      // Connect to NATS server
      this.connection = await connect(connectionOptions);
      
      // Generate unique connection ID
      this.connectionId = `nats-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Setup event handlers
      this.connection.closed().then(() => {
        log('NATS connection closed', 'nats');
        this._onDisconnect(false);
      }).catch((error) => {
        log(`NATS connection error: ${error.message}`, 'error');
        this._onDisconnect(true, error);
      });
      
      // Update status and track connection
      this._updateConnectionStatus('connected');
      await this._trackConnection();
      
      // Restore subscriptions
      await this._restoreSubscriptions();
      
      // Process any pending messages
      this._processPendingMessages();
      
      // Start ping interval for heartbeats
      this._startPingInterval();
      
      // Call success callback
      if (this.options.onConnect) {
        this.options.onConnect();
      }
      
      log(`Connected to NATS server successfully as ${this.options.name || 'unnamed client'}`, 'nats');
      
      // Reset reconnect attempts counter on successful connection
      this.reconnectAttempts = 0;
      
    } catch (error) {
      log(`Failed to connect to NATS server: ${(error as Error).message}`, 'error');
      throw error;
    }
  }
  
  /**
   * Clean disconnect from the NATS server
   */
  async disconnect(): Promise<void> {
    if (!this.connection) {
      return;
    }
    
    try {
      log('Disconnecting from NATS server', 'nats');
      
      // Stop ping interval
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }
      
      // Clear any reconnect timeout
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      
      // Update database with disconnection status
      await this._updateConnectionDisconnected('manual disconnect');
      
      // Drain and close connection
      await this.connection.drain();
      this.connection = null;
      
      // Update status
      this._updateConnectionStatus('disconnected');
      
      log('Disconnected from NATS server', 'nats');
      
      // Call disconnect callback
      if (this.options.onDisconnect) {
        this.options.onDisconnect();
      }
    } catch (error) {
      log(`Error disconnecting from NATS server: ${(error as Error).message}`, 'error');
      throw error;
    }
  }
  
  /**
   * Publish a message to a NATS subject
   * If disconnected, the message will be queued for sending when connection is restored
   * 
   * @param subject NATS subject to publish to
   * @param data Data to publish (will be JSON stringified)
   * @param msgHeaders Optional headers to include with the message
   * @returns True if published immediately, false if queued for later
   */
  async publish(subject: string, data: any, msgHeaders?: Record<string, string>): Promise<boolean> {
    if (!this.connection || this.connectionStatus !== 'connected') {
      // Queue the message for later
      return this._queueMessage({ subject, data, headers: msgHeaders });
    }
    
    try {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Create headers if provided
      let hdrs: MsgHdrs | undefined;
      if (msgHeaders) {
        hdrs = headers();
        Object.entries(msgHeaders).forEach(([k, v]) => {
          hdrs?.append(k, v);
        });
      }
      
      // Publish the message
      await this.connection.publish(subject, this._encodeData(payload), { headers: hdrs });
      
      // Update metrics
      this.messagesSent++;
      this._updateConnectionActivity();
      
      // Log for debug purposes
      if (process.env.NODE_ENV === 'development') {
        log(`Published message to ${subject}`, 'nats-debug');
      }
      
      return true;
    } catch (error) {
      log(`Error publishing message to ${subject}: ${(error as Error).message}`, 'error');
      
      // Queue the message for retry
      this._queueMessage({ subject, data, headers: msgHeaders });
      
      // If we get an error here, we might be disconnected - schedule reconnect
      this._handleError(error as Error);
      
      return false;
    }
  }
  
  /**
   * Subscribe to a NATS subject
   * 
   * @param subject Subject to subscribe to
   * @param callback Function to call when a message is received
   * @param options Subscription options
   * @returns SubscriptionId that can be used to unsubscribe
   */
  async subscribe(
    subject: string, 
    callback: (data: any, headers?: Record<string, string>, msg?: Msg) => void,
    queue?: string
  ): Promise<string> {
    // Generate a subscription ID
    const subscriptionId = `${subject}:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
    
    // Store the subscription handler
    this.subscriptionHandlers.push({ subject, queue, callback });
    
    // If connected, set up the subscription immediately
    if (this.connection && this.connectionStatus === 'connected') {
      try {
        const sub = queue 
          ? await this.connection.subscribe(subject, { queue })
          : await this.connection.subscribe(subject);
          
        this.subscriptions.set(subscriptionId, sub);
        
        // Process subscription messages
        this._processSubscription(sub, callback);
        
        log(`Subscribed to ${subject}${queue ? ` with queue ${queue}` : ''}`, 'nats');
      } catch (error) {
        log(`Error subscribing to ${subject}: ${(error as Error).message}`, 'error');
        throw error;
      }
    } else {
      log(`Queued subscription to ${subject} for when connection is established`, 'nats');
    }
    
    return subscriptionId;
  }
  
  /**
   * Unsubscribe from a NATS subject
   * 
   * @param subscriptionId The ID returned by subscribe()
   * @returns True if successfully unsubscribed
   */
  async unsubscribe(subscriptionId: string): Promise<boolean> {
    const subscription = this.subscriptions.get(subscriptionId);
    
    if (!subscription) {
      return false;
    }
    
    try {
      await subscription.unsubscribe();
      this.subscriptions.delete(subscriptionId);
      
      // Remove from subscription handlers
      // Find the index based on subject and time matching the subscriptionId
      const [subject, timestamp] = subscriptionId.split(':');
      const indexToRemove = this.subscriptionHandlers.findIndex(sh => 
        sh.subject === subject && subscriptionId.includes(timestamp));
      
      if (indexToRemove !== -1) {
        this.subscriptionHandlers.splice(indexToRemove, 1);
      }
      
      log(`Unsubscribed from ${subscriptionId}`, 'nats');
      return true;
    } catch (error) {
      log(`Error unsubscribing from ${subscriptionId}: ${(error as Error).message}`, 'error');
      return false;
    }
  }
  
  /**
   * Check if the client is currently connected
   * @returns True if connected to NATS
   */
  isConnected(): boolean {
    return !!(this.connection && this.connectionStatus === 'connected');
  }
  
  /**
   * Get the current connection status
   * @returns The current connection status
   */
  getStatus(): NatsConnectionStatus {
    return this.connectionStatus;
  }
  
  /**
   * Get connection metrics
   * @returns Object with connection metrics
   */
  getMetrics() {
    return {
      connectionId: this.connectionId,
      uptime: this.connectionStartTime ? Date.now() - this.connectionStartTime : 0,
      reconnectAttempts: this.reconnectAttempts,
      status: this.connectionStatus,
      messagesSent: this.messagesSent,
      messagesReceived: this.messagesReceived,
      pendingMessages: this.pendingMessages.length,
      subscriptions: this.subscriptions.size,
      lastPingTime: this.lastPingTime ? new Date(this.lastPingTime).toISOString() : null,
    };
  }
  
  /**
   * Processes messages from a subscription
   */
  private _processSubscription(
    subscription: Subscription, 
    callback: (data: any, headers?: Record<string, string>, msg?: Msg) => void
  ): void {
    // Start processing messages from this subscription
    (async () => {
      for await (const msg of subscription) {
        try {
          const data = this._decodeData(msg.data);
          
          // Extract headers if any
          let hdrs: Record<string, string> | undefined;
          if (msg.headers) {
            hdrs = {};
            for (const [key, value] of msg.headers) {
              hdrs[key] = value;
            }
          }
          
          // Call the user callback with the message data
          callback(data, hdrs, msg);
          
          // Update metrics
          this.messagesReceived++;
          this._updateConnectionActivity();
          
        } catch (error) {
          log(`Error processing NATS message: ${(error as Error).message}`, 'error');
        }
      }
    })().catch((error) => {
      log(`Subscription processing error: ${error.message}`, 'error');
    });
  }
  
  /**
   * Restore all subscriptions after reconnection
   */
  private async _restoreSubscriptions(): Promise<void> {
    if (!this.connection || this.subscriptionHandlers.length === 0) {
      return;
    }
    
    log(`Restoring ${this.subscriptionHandlers.length} subscriptions`, 'nats');
    
    // Clear existing subscriptions
    this.subscriptions.clear();
    
    // Create new subscriptions for all handlers
    for (const { subject, queue, callback } of this.subscriptionHandlers) {
      try {
        const sub = queue 
          ? await this.connection.subscribe(subject, { queue })
          : await this.connection.subscribe(subject);
        
        const subscriptionId = `${subject}:${Date.now()}:${Math.random().toString(36).substring(2, 9)}`;
        this.subscriptions.set(subscriptionId, sub);
        
        // Process subscription messages
        this._processSubscription(sub, callback);
        
        log(`Restored subscription to ${subject}${queue ? ` with queue ${queue}` : ''}`, 'nats');
      } catch (error) {
        log(`Error restoring subscription to ${subject}: ${(error as Error).message}`, 'error');
      }
    }
  }
  
  /**
   * Queue a message for later delivery
   */
  private _queueMessage(message: NatsMessage): boolean {
    // Check if we're over capacity
    if (this.pendingMessages.length >= (this.options.maxPendingMessages || 1000)) {
      log(`Pending message queue full, dropping message to ${message.subject}`, 'error');
      return false;
    }
    
    // Add to pending queue
    this.pendingMessages.push({
      ...message,
      timestamp: Date.now(),
      attempts: 0
    });
    
    log(`Queued message to ${message.subject} for later delivery. Queue size: ${this.pendingMessages.length}`, 'nats');
    return true;
  }
  
  /**
   * Process any pending messages after reconnection
   */
  private _processPendingMessages(): void {
    if (this.pendingMessages.length === 0 || !this.connection) {
      return;
    }
    
    log(`Processing ${this.pendingMessages.length} pending messages`, 'nats');
    
    // Process all pending messages
    const messages = [...this.pendingMessages];
    this.pendingMessages = [];
    
    // Attempt to publish each message
    messages.forEach(async (msg) => {
      try {
        const result = await this.publish(msg.subject, msg.data, msg.headers);
        if (!result) {
          // If failed again but attempts are under limit, requeue
          if (msg.attempts < 5) {
            this.pendingMessages.push({
              ...msg,
              attempts: msg.attempts + 1
            });
          } else {
            log(`Dropping message to ${msg.subject} after ${msg.attempts} failed attempts`, 'error');
          }
        }
      } catch (error) {
        log(`Error publishing pending message to ${msg.subject}: ${(error as Error).message}`, 'error');
      }
    });
  }
  
  /**
   * Handle connection errors
   */
  private _handleError(error: Error): void {
    log(`NATS client error: ${error.message}`, 'error');
    
    // Call error callback if provided
    if (this.options.onError) {
      this.options.onError(error);
    }
    
    // Record error metric
    metricsService.recordMetric('nats', 'nats_connection_errors', 1);
  }
  
  /**
   * Update connection status and notify listeners
   */
  private _updateConnectionStatus(status: NatsConnectionStatus): void {
    if (this.connectionStatus === status) {
      return;
    }
    
    log(`NATS connection status changed: ${this.connectionStatus} -> ${status}`, 'nats');
    this.connectionStatus = status;
    
    // Call status change callback if provided
    if (this.options.onStatusChange) {
      this.options.onStatusChange(status);
    }
    
    // Record status in metrics (1 for connected, 0 for disconnected)
    metricsService.recordMetric(
      'nats', 
      'nats_connection_status', 
      status === 'connected' ? 1 : 0
    );
    
    // Update connection status in database
    if (this.dbConnectionId) {
      this._updateConnectionInDatabase({ status });
    }
  }
  
  /**
   * Handle disconnection events
   */
  private _onDisconnect(isError: boolean, error?: Error): void {
    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // Update connection status
    this._updateConnectionStatus(isError ? 'error' : 'disconnected');
    
    // Update database
    this._updateConnectionDisconnected(isError ? error?.message || 'unknown error' : 'normal closure');
    
    // Schedule reconnection
    this._scheduleReconnect();
    
    // Call disconnect callback
    if (this.options.onDisconnect) {
      this.options.onDisconnect();
    }
  }
  
  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private _scheduleReconnect(): void {
    if (this.reconnectAttempts >= (this.options.maxReconnectAttempts || 10)) {
      log(`Maximum reconnection attempts (${this.options.maxReconnectAttempts}) reached. Giving up.`, 'error');
      return;
    }
    
    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectAttempts++;
    
    // Calculate delay with exponential backoff if enabled
    let delay = this.options.reconnectTimeWait || 1000;
    if (this.options.useExponentialBackoff) {
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 + 0.8; // 0.8-1.1 multiplier
      delay = Math.min(30000, delay * Math.pow(1.5, this.reconnectAttempts - 1)) * jitter;
    }
    
    log(`Scheduling NATS reconnect attempt ${this.reconnectAttempts} in ${Math.round(delay)}ms`, 'nats');
    
    this._updateConnectionStatus('reconnecting');
    
    this.reconnectTimeout = setTimeout(() => {
      this._connect().catch((error) => {
        log(`Reconnect attempt ${this.reconnectAttempts} failed: ${error.message}`, 'error');
        this._scheduleReconnect();
      });
    }, delay);
  }
  
  /**
   * Start ping interval for heartbeats
   */
  private _startPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    const interval = this.options.pingInterval || 30000;
    
    this.pingInterval = setInterval(() => {
      this._sendPing();
    }, interval);
  }
  
  /**
   * Send a ping to verify connection is still alive
   */
  private async _sendPing(): Promise<void> {
    if (!this.connection || this.connectionStatus !== 'connected') {
      return;
    }
    
    try {
      // Check if connection is still responding
      await Promise.race([
        this.connection.flush(),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Ping timeout')), this.options.maxPingTimeout || 5000);
        })
      ]);
      
      // Update last ping time
      this.lastPingTime = Date.now();
      this._updateConnectionActivity();
      
      if (process.env.NODE_ENV === 'development') {
        log('NATS ping successful', 'nats-debug');
      }
    } catch (error) {
      log(`NATS ping failed: ${(error as Error).message}`, 'error');
      
      // The connection might be dead but not reporting it yet - force disconnect
      this._onDisconnect(true, error as Error);
    }
  }
  
  /**
   * Track connection in database
   */
  private async _trackConnection(): Promise<void> {
    try {
      if (!this.connection) return;
      
      // Create connection record in database
      const connectionData: InsertNatsConnection = {
        connectionId: this.connectionId,
        serviceName: this.options.name || 'unnamed',
        status: 'connected',
        connectionInfo: JSON.stringify({
          servers: this.options.servers,
          clientName: this.options.name
        }),
        connectionTime: new Date(),
        lastActivity: new Date(),
        lastPingTime: new Date(),
        reconnectCount: this.reconnectAttempts,
        messagesSent: 0,
        messagesReceived: 0,
        subscriptions: JSON.stringify(
          this.subscriptionHandlers.map(s => ({ subject: s.subject, queue: s.queue }))
        ),
      };
      
      const connection = await storage.createNatsConnection(connectionData);
      this.dbConnectionId = connection.id;
      
      log(`NATS connection tracked in database. ID: ${this.connectionId}`, 'nats');
    } catch (error) {
      log(`Error tracking NATS connection in database: ${(error as Error).message}`, 'error');
    }
  }
  
  /**
   * Update connection activity timestamp
   */
  private async _updateConnectionActivity(): Promise<void> {
    try {
      if (!this.dbConnectionId) return;
      
      await storage.updateNatsConnection(this.dbConnectionId, {
        lastActivity: new Date(),
        lastPingTime: this.lastPingTime ? new Date(this.lastPingTime) : undefined,
        messagesSent: this.messagesSent,
        messagesReceived: this.messagesReceived
      });
    } catch (error) {
      log(`Error updating NATS connection activity: ${(error as Error).message}`, 'error');
    }
  }
  
  /**
   * Update connection status in database
   */
  private async _updateConnectionInDatabase(updates: Partial<NatsConnectionType>): Promise<void> {
    try {
      if (!this.dbConnectionId) return;
      
      await storage.updateNatsConnection(this.dbConnectionId, updates);
    } catch (error) {
      log(`Error updating NATS connection in database: ${(error as Error).message}`, 'error');
    }
  }
  
  /**
   * Update connection as disconnected in database
   */
  private async _updateConnectionDisconnected(reason: string): Promise<void> {
    try {
      if (!this.dbConnectionId) return;
      
      await storage.updateNatsConnection(this.dbConnectionId, {
        status: 'disconnected',
        disconnectionTime: new Date(),
        disconnectionReason: reason,
        messagesSent: this.messagesSent,
        messagesReceived: this.messagesReceived
      });
    } catch (error) {
      log(`Error updating NATS disconnection in database: ${(error as Error).message}`, 'error');
    }
  }
  
  /**
   * Encode data for sending
   */
  private _encodeData(data: string): Uint8Array {
    return new TextEncoder().encode(data);
  }
  
  /**
   * Decode received data
   */
  private _decodeData(data: Uint8Array): any {
    const text = new TextDecoder().decode(data);
    try {
      return JSON.parse(text);
    } catch {
      // If it's not valid JSON, return the raw text
      return text;
    }
  }
}

/**
 * Create a singleton instance of the NATS client
 */
export const createNatsClient = (options: NatsClientOptions): NatsClient => {
  return new NatsClient(options);
};