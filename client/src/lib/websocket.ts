/**
 * WebSocket client for real-time updates in TerraFusion platform
 */

// Define message types
export type WebSocketMessage = {
  type: string;
  [key: string]: any;
};

// Channel subscription options
export interface SubscriptionOptions {
  channel: string;
  onMessage?: (data: any) => void;
}

class WebSocketClient {
  private socket: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // Base delay in ms
  private subscriptions: Map<string, (data: any) => void> = new Map();
  private messageQueue: WebSocketMessage[] = [];
  private connected = false;

  constructor() {
    this.connect();
    // Add event listener for when page becomes visible again
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && !this.connected) {
        this.connect();
      }
    });
  }

  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      // Create the correct WebSocket URL based on the current environment
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      console.log('Connecting to WebSocket server at:', wsUrl);
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Send a message to the WebSocket server
   */
  public send(message: WebSocketMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      // Queue the message for when we reconnect
      this.messageQueue.push(message);
      // Try to connect if not already connecting
      if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
        this.connect();
      }
    }
  }

  /**
   * Subscribe to a specific channel
   */
  public subscribe(options: SubscriptionOptions): () => void {
    const { channel, onMessage } = options;

    // Store the callback
    if (onMessage) {
      this.subscriptions.set(channel, onMessage);
    }

    // Send subscription request if connected
    if (this.connected) {
      this.send({
        type: 'subscribe',
        channel
      });
    }

    // Return unsubscribe function
    return () => {
      this.subscriptions.delete(channel);
      if (this.connected) {
        this.send({
          type: 'unsubscribe',
          channel
        });
      }
    };
  }

  /**
   * Send a ping to keep the connection alive
   */
  public ping(): void {
    this.send({
      type: 'ping',
      timestamp: Date.now()
    });
  }

  /**
   * Close the WebSocket connection
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.connected = false;
  }

  // Private methods
  private handleOpen(event: Event): void {
    console.log('WebSocket connection established');
    this.connected = true;
    this.reconnectAttempts = 0;

    // Resubscribe to all channels
    this.subscriptions.forEach((_, channel) => {
      this.send({
        type: 'subscribe',
        channel
      });
    });

    // Send any queued messages
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }

    // Set up ping interval to keep connection alive
    setInterval(() => this.ping(), 30000); // Ping every 30 seconds
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket connection closed:', event.code, event.reason);
    this.connected = false;
    this.scheduleReconnect();
  }

  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    // The close event will be called automatically after the error
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      console.log('WebSocket message received:', data);

      // Handle different message types
      switch (data.type) {
        case 'pong':
          // Received pong, connection is alive
          break;

        case 'crop_analysis_update':
          // Handle crop analysis updates
          this.notifySubscribers('crop_analysis', data);
          break;

        case 'crop_identification_update':
          // Handle crop identification updates
          this.notifySubscribers('crop_identification', data);
          break;

        case 'system_notification':
          // Handle system notifications
          this.notifySubscribers('notifications', data);
          break;

        default:
          // Check if any subscribers for this specific message type
          this.notifySubscribers(data.type, data);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private notifySubscribers(channel: string, data: any): void {
    const callback = this.subscriptions.get(channel);
    if (callback) {
      callback(data);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null) {
      return; // Already scheduled
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Maximum reconnect attempts reached');
      return;
    }

    // Exponential backoff with jitter
    const delay = Math.min(
      30000, // Max delay of 30 seconds
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts) * (0.9 + Math.random() * 0.2)
    );

    console.log(`Scheduling reconnect in ${Math.round(delay)}ms`);

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }
}

// Create a singleton instance
export const websocketClient = new WebSocketClient();

// React hook for using WebSocket subscriptions
import { useEffect } from 'react';

export function useWebSocketSubscription(options: SubscriptionOptions): void {
  useEffect(() => {
    // Return the unsubscribe function for cleanup
    return websocketClient.subscribe(options);
  }, [options.channel]); // Re-subscribe if channel changes
}

// Export the singleton instance
export default websocketClient;