import { db } from "../db";
import { systemMetrics } from "@shared/schema";
import { log } from "../vite";

// In-memory metrics storage for demo purposes
// In a real implementation, we would use Prometheus client library
class SimpleMetricsRegistry {
  private metrics: Map<string, number> = new Map();
  private counters: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  
  // Counter implementation
  incrementCounter(name: string, labels: Record<string, string> = {}, value: number = 1): void {
    const key = this.formatKey(name, labels);
    const currentValue = this.counters.get(key) || 0;
    this.counters.set(key, currentValue + value);
  }
  
  // Gauge implementation
  setGauge(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.formatKey(name, labels);
    this.metrics.set(key, value);
  }
  
  // Histogram implementation
  observeHistogram(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = this.formatKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
  }
  
  // Get metric value
  getMetric(name: string, labels: Record<string, string> = {}): number | undefined {
    const key = this.formatKey(name, labels);
    return this.metrics.get(key);
  }
  
  // Get counter value
  getCounter(name: string, labels: Record<string, string> = {}): number | undefined {
    const key = this.formatKey(name, labels);
    return this.counters.get(key);
  }
  
  // Get histogram values
  getHistogram(name: string, labels: Record<string, string> = {}): number[] | undefined {
    const key = this.formatKey(name, labels);
    return this.histograms.get(key);
  }
  
  // Format prometheus metrics output
  metrics(): string {
    const lines: string[] = [];
    
    // Add counter metrics
    for (const [key, value] of this.counters.entries()) {
      lines.push(`# TYPE ${key} counter`);
      lines.push(`${key} ${value}`);
    }
    
    // Add gauge metrics
    for (const [key, value] of this.metrics.entries()) {
      lines.push(`# TYPE ${key} gauge`);
      lines.push(`${key} ${value}`);
    }
    
    // Add histogram metrics
    for (const [key, values] of this.histograms.entries()) {
      lines.push(`# TYPE ${key} histogram`);
      
      if (values.length > 0) {
        // Calculate some basic percentiles
        const sorted = [...values].sort((a, b) => a - b);
        const count = sorted.length;
        const sum = sorted.reduce((a, b) => a + b, 0);
        const p50 = sorted[Math.floor(count * 0.5)];
        const p90 = sorted[Math.floor(count * 0.9)];
        const p99 = sorted[Math.floor(count * 0.99)];
        
        lines.push(`${key}_count ${count}`);
        lines.push(`${key}_sum ${sum}`);
        lines.push(`${key}{quantile="0.5"} ${p50}`);
        lines.push(`${key}{quantile="0.9"} ${p90}`);
        lines.push(`${key}{quantile="0.99"} ${p99}`);
      }
    }
    
    return lines.join('\n');
  }
  
  private formatKey(name: string, labels: Record<string, string>): string {
    if (Object.keys(labels).length === 0) {
      return name;
    }
    
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    
    return `${name}{${labelStr}}`;
  }
}

// Create a global registry
const registry = new SimpleMetricsRegistry();

// HTTP request metrics
export function incrementHttpRequests(method: string, path: string, statusCode: number): void {
  registry.incrementCounter('http_requests_total', { method, path, status_code: String(statusCode) });
}

export function observeHttpDuration(method: string, path: string, durationMs: number): void {
  registry.observeHistogram('http_request_duration_seconds', durationMs / 1000, { method, path });
}

export function incrementHttpErrors(method: string, path: string, errorType: string): void {
  registry.incrementCounter('http_requests_errors_total', { method, path, error_type: errorType });
}

// Geocode call metrics
export function incrementGeocodeCall(tenantId: number, success: boolean, chargeStatus: string): void {
  registry.incrementCounter('geocode_calls_total', { 
    tenant_id: String(tenantId),
    success: String(success),
    charge_status: chargeStatus
  });
}

export function observeGeocodeLatency(tenantId: number, durationMs: number): void {
  registry.observeHistogram('geocode_latency_seconds', durationMs / 1000, { tenant_id: String(tenantId) });
}

// System metrics
export function setSystemCpuUsage(value: number): void {
  registry.setGauge('system_cpu_usage', value);
}

export function setSystemMemoryUsage(bytes: number): void {
  registry.setGauge('system_memory_usage_bytes', bytes);
}

export function setJobQueueSize(size: number): void {
  registry.setGauge('job_queue_size', size);
}

export function setActiveSubscriptions(count: number): void {
  registry.setGauge('active_subscriptions', count);
}

/**
 * Collects metrics about the system for observability
 */
class MetricsService {
  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<any> {
    // Simulate simple CPU metrics
    const cpuPercentage = Math.random() * 100;
    const memoryBytes = Math.round(Math.random() * 1024 * 1024 * 1024);
    
    // Update metrics
    setSystemCpuUsage(cpuPercentage);
    setSystemMemoryUsage(memoryBytes);
    
    // Sample metrics for UI display
    return {
      status: "Healthy",
      cpu: {
        value: Math.round(cpuPercentage),
        trend: "stable"
      },
      memory: {
        value: Math.round(memoryBytes / (1024 * 1024)),
        total: 8192,
        trend: "stable"
      },
      disk: {
        value: 38,
        total: 100,
        trend: "increasing"
      },
      network: {
        rx: 1.3,
        tx: 0.8,
        trend: "stable"
      }
    };
  }
  
  /**
   * Initialize AI provider metrics
   * This is called during system initialization
   */
  async initializeAiProviders(): Promise<void> {
    try {
      // Initialize AI provider metrics
      registry.setGauge('ai_provider_count', 2);
      registry.setGauge('ai_provider_availability', 100, { provider: 'openai' });
      registry.setGauge('ai_provider_availability', 98.5, { provider: 'anthropic' });
      
      log('Initialized AI provider metrics', 'metrics');
    } catch (error) {
      log(`Error initializing AI provider metrics: ${error}`, 'error');
    }
  }
  
  /**
   * Get Prometheus metrics in text format
   */
  async getPrometheusMetrics(): Promise<string> {
    return registry.metrics();
  }
  
  /**
   * Record a system metric in the database
   */
  async recordMetric(serviceName: string, metricName: string, value: number): Promise<void> {
    try {
      await db.insert(systemMetrics).values({
        service: serviceName,
        name: metricName,
        value,
        timestamp: new Date()
      });
      
      log(`Recorded metric ${metricName} = ${value} for service ${serviceName}`, 'metrics');
    } catch (error) {
      log(`Error recording metric: ${error}`, 'error');
      throw error;
    }
  }
}

export const metricsService = new MetricsService();