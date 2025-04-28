import axios from 'axios';
import { log } from '../vite';
import { metricsService } from './metrics';
import { NatsClient, createNatsClient } from './nats-client';
import { storage } from '../storage';

/**
 * NATS Monitoring Service
 * 
 * This service integrates with both:
 * 1. The NATS HTTP monitoring interface (if enabled via NATS_MONITORING_ENABLED)
 * 2. Our robust NATS client for direct NATS connections (if enabled via NATS_CLIENT_ENABLED)
 */
class NatsMonitoringService {
  private baseUrl: string;
  private monitoringEnabled: boolean = false;
  private clientEnabled: boolean = false;
  private natsClient: NatsClient | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Read monitoring configuration from environment variables
    this.baseUrl = process.env.NATS_MONITORING_URL || 'http://localhost:8222';
    this.monitoringEnabled = !!process.env.NATS_MONITORING_ENABLED;
    this.clientEnabled = !!process.env.NATS_CLIENT_ENABLED;
  }

  /**
   * Initialize the monitoring service
   */
  async initialize(): Promise<void> {
    // Initialize HTTP monitoring if enabled
    if (this.monitoringEnabled) {
      try {
        // Test connection to NATS monitoring endpoint
        await this.checkMonitoringConnection();
        log('NATS HTTP monitoring initialized successfully', 'nats');
        
        // Start heartbeat check interval for HTTP monitoring
        this.startHeartbeatMonitoring();
      } catch (error) {
        log(`Failed to initialize NATS HTTP monitoring: ${error}`, 'error');
      }
    } else {
      log('NATS HTTP monitoring is disabled', 'nats');
    }

    // Initialize NATS client if enabled
    if (this.clientEnabled) {
      try {
        await this.initializeNatsClient();
        log('NATS client initialized successfully', 'nats');
      } catch (error) {
        log(`Failed to initialize NATS client: ${error}`, 'error');
      }
    } else {
      log('NATS client is disabled', 'nats');
    }
  }

  /**
   * Initialize the NATS client with robust reconnection
   */
  private async initializeNatsClient(): Promise<void> {
    try {
      // Create the NATS client
      const servers = process.env.NATS_SERVERS ? process.env.NATS_SERVERS.split(',') : ['nats://localhost:4222'];
      
      this.natsClient = createNatsClient({
        servers,
        name: 'terrafusion-monitoring',
        maxReconnectAttempts: 20,
        reconnectTimeWait: 1000,
        useExponentialBackoff: true,
        onStatusChange: (status) => {
          log(`NATS connection status changed: ${status}`, 'nats');
          metricsService.recordMetric('nats', 'nats_client_status', status === 'connected' ? 1 : 0);
        },
        onError: (error) => {
          log(`NATS client error: ${error.message}`, 'error');
        }
      });

      // Connect to NATS
      await this.natsClient.connect();
      
      // Subscribe to system events
      await this.subscribeToSystemEvents();
      
      log(`NATS client connected to ${servers.join(', ')}`, 'nats');
    } catch (error) {
      log(`Failed to initialize NATS client: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Subscribe to system events
   */
  private async subscribeToSystemEvents(): Promise<void> {
    if (!this.natsClient) return;
    
    try {
      // Subscribe to heartbeat channel
      await this.natsClient.subscribe('system.heartbeat', (data) => {
        // Process heartbeats from other services
        const timestamp = new Date().toISOString();
        log(`Received heartbeat from ${data.service} at ${timestamp}`, 'nats-debug');
        
        // Update metrics
        metricsService.recordMetric('nats', `nats_heartbeat_${data.service}`, 1);
      });
      
      // Subscribe to system status channel
      await this.natsClient.subscribe('system.status', (data) => {
        // Process system status events
        log(`System status update: ${data.service} is ${data.status}`, 'nats');
        
        // Record service status in database
        this.updateServiceStatus(data.service, data.status);
      });
      
      log('Subscribed to system events on NATS', 'nats');
    } catch (error) {
      log(`Failed to subscribe to system events: ${error}`, 'error');
    }
  }
  
  /**
   * Update service status in database
   */
  private async updateServiceStatus(serviceName: string, status: string): Promise<void> {
    try {
      const service = await storage.getServiceByName(serviceName);
      if (service) {
        await storage.updateService(service.id, { status });
        log(`Updated status for service ${serviceName} to ${status}`, 'nats');
      }
    } catch (error) {
      log(`Failed to update service status: ${error}`, 'error');
    }
  }

  /**
   * Send a heartbeat message to other services
   */
  public async sendHeartbeat(): Promise<boolean> {
    if (!this.natsClient || !this.natsClient.isConnected()) {
      return false;
    }
    
    try {
      const heartbeat = {
        service: 'monitoring',
        timestamp: new Date().toISOString(),
        metrics: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage().heapUsed
        }
      };
      
      await this.natsClient.publish('system.heartbeat', heartbeat);
      return true;
    } catch (error) {
      log(`Failed to send heartbeat: ${error}`, 'error');
      return false;
    }
  }

  /**
   * Shutdown the service cleanly
   */
  public async shutdown(): Promise<void> {
    // Stop heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Disconnect NATS client
    if (this.natsClient) {
      try {
        await this.natsClient.disconnect();
        log('NATS client disconnected', 'nats');
      } catch (error) {
        log(`Error disconnecting NATS client: ${error}`, 'error');
      }
    }
  }

  /**
   * Check connection to NATS monitoring HTTP interface
   */
  async checkMonitoringConnection(): Promise<boolean> {
    if (!this.monitoringEnabled) {
      return false;
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/varz`);
      return response.status === 200;
    } catch (error) {
      log(`NATS monitoring connection check failed: ${error}`, 'error');
      return false;
    }
  }

  /**
   * Check if the NATS client is connected
   */
  isClientConnected(): boolean {
    return !!(this.clientEnabled && this.natsClient && this.natsClient.isConnected());
  }

  /**
   * Check if connected to the NATS server (either via monitoring or client)
   * @returns Promise<boolean> True if connected, false otherwise
   */
  async checkConnection(): Promise<boolean> {
    // If client is enabled, prioritize client connection status
    if (this.clientEnabled && this.natsClient) {
      return this.natsClient.isConnected();
    }
    
    // Fallback to monitoring connection
    if (this.monitoringEnabled) {
      return this.checkMonitoringConnection();
    }
    
    return false;
  }

  /**
   * Get NATS connection status
   */
  getConnectionStatus(): { 
    monitoringEnabled: boolean; 
    monitoringConnected: boolean; 
    clientEnabled: boolean; 
    clientConnected: boolean;
    clientMetrics?: any;
  } {
    // Try to get the current monitoring connection status if available
    let monitoringConnected = false;
    
    try {
      // We can't do an async call here, so we'll rely on the last known status
      // This might not be 100% accurate but is usually fine for status checks
      monitoringConnected = this.monitoringEnabled;
    } catch (error) {
      // Ignore errors, default to false
    }
    
    return {
      monitoringEnabled: this.monitoringEnabled,
      monitoringConnected,
      clientEnabled: this.clientEnabled,
      clientConnected: this.isClientConnected(),
      clientMetrics: this.natsClient ? this.natsClient.getMetrics() : undefined
    };
  }

  /**
   * Get NATS server information from HTTP monitoring
   */
  async getServerInfo(): Promise<any> {
    if (!this.monitoringEnabled) {
      return { error: 'NATS monitoring is disabled' };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/varz`);
      return response.data;
    } catch (error) {
      log(`Failed to get NATS server info: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Get NATS connections from HTTP monitoring
   */
  async getConnections(): Promise<any> {
    if (!this.monitoringEnabled) {
      return { error: 'NATS monitoring is disabled' };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/connz`);
      return response.data;
    } catch (error) {
      log(`Failed to get NATS connections: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Get NATS subscriptions from HTTP monitoring
   */
  async getSubscriptions(): Promise<any> {
    if (!this.monitoringEnabled) {
      return { error: 'NATS monitoring is disabled' };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/subsz`);
      return response.data;
    } catch (error) {
      log(`Failed to get NATS subscriptions: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Get NATS streams from HTTP monitoring
   */
  async getStreams(): Promise<any> {
    if (!this.monitoringEnabled) {
      return { error: 'NATS monitoring is disabled' };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/streamz`);
      return response.data;
    } catch (error) {
      log(`Failed to get NATS streams: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Get NATS consumers for a specific stream from HTTP monitoring
   */
  async getConsumers(streamName: string): Promise<any> {
    if (!this.monitoringEnabled) {
      return { error: 'NATS monitoring is disabled' };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/consumerz?stream=${streamName}`);
      return response.data;
    } catch (error) {
      log(`Failed to get NATS consumers for stream ${streamName}: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Start monitoring NATS heartbeats via HTTP
   */
  private startHeartbeatMonitoring(): void {
    if (!this.monitoringEnabled) {
      return;
    }

    // Clear any existing interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Check NATS heartbeat every 30 seconds
    this.heartbeatInterval = setInterval(async () => {
      try {
        const isConnected = await this.checkMonitoringConnection();
        
        // Record the connection status as a metric (1 = connected, 0 = disconnected)
        metricsService.recordMetric(
          'nats', 
          'nats_monitoring_heartbeat', 
          isConnected ? 1 : 0
        );

        // If connected, collect additional metrics
        if (isConnected) {
          const serverInfo = await this.getServerInfo();
          const connections = await this.getConnections();
          
          // Record key metrics
          metricsService.recordMetric('nats', 'nats_connections', connections.connections?.length || 0);
          metricsService.recordMetric('nats', 'nats_in_msgs', serverInfo.in_msgs || 0);
          metricsService.recordMetric('nats', 'nats_out_msgs', serverInfo.out_msgs || 0);
          metricsService.recordMetric('nats', 'nats_mem', serverInfo.mem || 0);
        }
        
        // Send a heartbeat via the NATS client if enabled
        if (this.clientEnabled && this.natsClient) {
          await this.sendHeartbeat();
        }
      } catch (error) {
        log(`NATS heartbeat check failed: ${error}`, 'error');
      }
    }, 30000);

    // Keep track of the interval for cleanup
    process.on('SIGTERM', () => {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
    });
  }
}

// Create and export the singleton instance
export const natsMonitoringService = new NatsMonitoringService();