import axios from 'axios';
import { log } from '../vite';
import { metricsService } from './metrics';

/**
 * NATS Monitoring Service
 * 
 * This service integrates with the NATS HTTP monitoring interface.
 * NATS must be configured to expose the monitoring endpoints.
 * 
 * Default NATS monitoring port is 8222
 */
class NatsMonitoringService {
  private baseUrl: string;
  private isEnabled: boolean = false;

  constructor() {
    // Read from environment variable or use default
    this.baseUrl = process.env.NATS_MONITORING_URL || 'http://localhost:8222';
    this.isEnabled = !!process.env.NATS_MONITORING_ENABLED;
  }

  /**
   * Initialize the monitoring service
   */
  async initialize(): Promise<void> {
    if (!this.isEnabled) {
      log('NATS monitoring is disabled', 'nats');
      return;
    }

    try {
      // Test connection to NATS monitoring endpoint
      await this.checkConnection();
      log('NATS monitoring initialized successfully', 'nats');
      
      // Start heartbeat check interval
      this.startHeartbeatMonitoring();
    } catch (error) {
      log(`Failed to initialize NATS monitoring: ${error}`, 'error');
    }
  }

  /**
   * Check connection to NATS monitoring
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/varz`);
      return response.status === 200;
    } catch (error) {
      log(`NATS monitoring connection check failed: ${error}`, 'error');
      return false;
    }
  }

  /**
   * Get NATS server information
   */
  async getServerInfo(): Promise<any> {
    if (!this.isEnabled) {
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
   * Get NATS connections
   */
  async getConnections(): Promise<any> {
    if (!this.isEnabled) {
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
   * Get NATS subscriptions
   */
  async getSubscriptions(): Promise<any> {
    if (!this.isEnabled) {
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
   * Get NATS streams
   */
  async getStreams(): Promise<any> {
    if (!this.isEnabled) {
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
   * Get NATS consumers for a specific stream
   */
  async getConsumers(streamName: string): Promise<any> {
    if (!this.isEnabled) {
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
   * Start monitoring NATS heartbeats
   * This runs in the background and records metrics for Prometheus
   */
  private startHeartbeatMonitoring(): void {
    if (!this.isEnabled) {
      return;
    }

    // Check NATS heartbeat every 30 seconds
    const heartbeatInterval = setInterval(async () => {
      try {
        const isConnected = await this.checkConnection();
        
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
      } catch (error) {
        log(`NATS heartbeat check failed: ${error}`, 'error');
      }
    }, 30000);

    // Keep track of the interval for cleanup
    process.on('SIGTERM', () => {
      clearInterval(heartbeatInterval);
    });
  }
}

export const natsMonitoringService = new NatsMonitoringService();