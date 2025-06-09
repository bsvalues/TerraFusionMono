// Enhanced TerraFusion JavaScript-Rust Bridge - Production Ready
import { spawn } from 'child_process';
import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import crypto from 'crypto';

class EnhancedTerraRustBridge extends EventEmitter {
  constructor() {
    super();
    this.wasmModule = null;
    this.nativeModule = null;
    this.isWasmAvailable = false;
    this.isNativeAvailable = false;
    this.performanceMetrics = new Map();
    this.circuitBreaker = new CircuitBreaker();
    this.performanceBaselines = new Map([
      ['property_validation', { baseline: 50, target: 5, current: null }],
      ['pacs_sync', { baseline: 5000, target: 500, current: null }],
      ['database_query', { baseline: 100, target: 20, current: null }],
      ['gis_calculation', { baseline: 200, target: 25, current: null }]
    ]);
    this.initializationPromise = this.initialize();
  }

  async initialize() {
    try {
      await Promise.all([
        this.initializeWasm(),
        this.initializeNative()
      ]);
      
      this.emit('initialized', {
        wasmAvailable: this.isWasmAvailable,
        nativeAvailable: this.isNativeAvailable
      });
      
      console.log('✅ Enhanced TerraFusion Bridge initialized');
    } catch (error) {
      console.error('❌ Bridge initialization failed:', error);
    }
  }

  async initializeWasm() {
    try {
      if (typeof WebAssembly !== 'undefined') {
        // Load WASM module when available
        this.wasmModule = await import('../wasm/terra_fusion.js');
        this.isWasmAvailable = true;
        console.log('✅ WASM module loaded');
      }
    } catch (error) {
      console.warn('⚠️ WASM unavailable:', error.message);
      this.isWasmAvailable = false;
    }
  }

  async initializeNative() {
    try {
      this.nativeModule = require('../native/terra_fusion.node');
      this.isNativeAvailable = true;
      console.log('✅ Native module loaded');
    } catch (error) {
      console.warn('⚠️ Native module unavailable:', error.message);
      this.isNativeAvailable = false;
    }
  }

  async callRustService(serviceName, method, params = {}, options = {}) {
    const operationId = `${serviceName}_${method}_${crypto.randomUUID()}`;
    const startTime = performance.now();
    
    if (!this.circuitBreaker.canExecute(serviceName)) {
      throw new Error(`Circuit breaker OPEN for service: ${serviceName}`);
    }

    try {
      const implementation = await this.selectOptimalImplementation(serviceName, method);
      let result;

      switch (implementation) {
        case 'wasm':
          result = await this.callWasmMethod(serviceName, method, params);
          break;
        case 'native':
          result = await this.callNativeMethod(serviceName, method, params);
          break;
        case 'process':
          result = await this.callRustProcess(serviceName, method, params);
          break;
        default:
          result = await this.fallbackToJavaScript(serviceName, method, params);
      }

      const duration = performance.now() - startTime;
      this.recordSuccessMetrics(operationId, implementation, duration);
      this.circuitBreaker.recordSuccess(serviceName);
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.circuitBreaker.recordFailure(serviceName);
      
      if (options.fallbackEnabled !== false) {
        console.warn(`Rust service failed, falling back: ${error.message}`);
        return await this.fallbackToJavaScript(serviceName, method, params);
      }
      
      throw error;
    }
  }

  async selectOptimalImplementation(serviceName, method) {
    if (this.isWasmAvailable && this.isOptimalForWasm(serviceName, method)) {
      return 'wasm';
    }
    if (this.isNativeAvailable && this.isOptimalForNative(serviceName, method)) {
      return 'native';
    }
    return 'process';
  }

  isOptimalForWasm(serviceName, method) {
    // WASM is optimal for computational tasks without I/O
    const wasmOptimal = ['validation', 'calculation', 'transformation'];
    return wasmOptimal.includes(serviceName);
  }

  isOptimalForNative(serviceName, method) {
    // Native modules are optimal for I/O intensive tasks
    const nativeOptimal = ['sync', 'database', 'file'];
    return nativeOptimal.includes(serviceName);
  }

  async callWasmMethod(serviceName, method, params) {
    if (!this.wasmModule) throw new Error('WASM module not available');
    
    const marshaledParams = JSON.stringify(params);
    const result = this.wasmModule[`${serviceName}_${method}`](marshaledParams);
    
    return typeof result === 'string' ? JSON.parse(result) : result;
  }

  async callNativeMethod(serviceName, method, params) {
    if (!this.nativeModule) throw new Error('Native module not available');
    
    return new Promise((resolve, reject) => {
      this.nativeModule[`${serviceName}_${method}`](params, (error, result) => {
        if (error) reject(new Error(error));
        else resolve(result);
      });
    });
  }

  async callRustProcess(serviceName, method, params) {
    const rustBinary = `terra-${serviceName}`;
    const inputData = JSON.stringify({ method, params });
    
    return new Promise((resolve, reject) => {
      const process = spawn(rustBinary, [], { stdio: ['pipe', 'pipe', 'pipe'] });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => stdout += data);
      process.stderr.on('data', (data) => stderr += data);
      
      process.on('close', (code) => {
        if (code === 0) {
          try {
            resolve(JSON.parse(stdout));
          } catch (error) {
            reject(new Error(`Invalid JSON response: ${stdout}`));
          }
        } else {
          reject(new Error(`Process exited with code ${code}: ${stderr}`));
        }
      });
      
      process.stdin.write(inputData);
      process.stdin.end();
    });
  }

  async fallbackToJavaScript(serviceName, method, params) {
    const fallbacks = {
      validation: async () => {
        const { PropertyValidator } = await import('../services/property-validator.js');
        const validator = new PropertyValidator();
        return await validator[method](params);
      },
      sync: async () => {
        const { PacsSync } = await import('../services/pacs-sync.js');
        const sync = new PacsSync();
        return await sync[method](params);
      },
      database: async () => {
        const { DatabaseManager } = await import('../services/database-manager.js');
        const db = new DatabaseManager();
        return await db[method](params);
      }
    };

    const fallback = fallbacks[serviceName];
    if (!fallback) {
      throw new Error(`No fallback available for service: ${serviceName}`);
    }

    return await fallback();
  }

  recordSuccessMetrics(operationId, implementation, duration) {
    const [serviceName, method] = operationId.split('_');
    const baseline = this.performanceBaselines.get(`${serviceName}_${method}`);
    
    if (baseline) {
      baseline.current = duration;
      baseline.improvement = baseline.baseline / duration;
      baseline.targetAchieved = duration <= baseline.target;
    }

    this.performanceMetrics.set(operationId, {
      implementation,
      duration,
      success: true,
      timestamp: Date.now()
    });
  }

  getPerformanceReport() {
    const baselines = Array.from(this.performanceBaselines.entries()).map(([key, data]) => ({
      operation: key,
      baseline: data.baseline,
      target: data.target,
      current: data.current,
      improvement: data.improvement || 1,
      targetAchieved: data.targetAchieved || false
    }));

    const successRate = this.calculateSuccessRate();
    const averageImprovement = this.calculateAverageImprovement();

    return {
      baselines,
      successRate,
      averageImprovement,
      totalOperations: this.performanceMetrics.size
    };
  }

  calculateSuccessRate() {
    if (this.performanceMetrics.size === 0) return 100;
    
    const successful = Array.from(this.performanceMetrics.values())
      .filter(m => m.success).length;
    
    return (successful / this.performanceMetrics.size) * 100;
  }

  calculateAverageImprovement() {
    const improvements = Array.from(this.performanceBaselines.values())
      .filter(b => b.improvement)
      .map(b => b.improvement);
    
    return improvements.length > 0 
      ? improvements.reduce((a, b) => a + b, 0) / improvements.length 
      : 1.0;
  }

  // High-level convenience methods
  async validateProperty(propertyData) {
    return await this.callRustService('validation', 'validateProperty', { propertyData });
  }

  async syncProperties(connectionString, batchSize = 1000) {
    return await this.callRustService('sync', 'synchronizeProperties', { connectionString, batchSize });
  }

  async executeQuery(query, parameters = []) {
    return await this.callRustService('database', 'executeQuery', { query, parameters });
  }

  async calculateGIS(operation, coordinates) {
    return await this.callRustService('gis', 'calculate', { operation, coordinates });
  }
}

class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failures = new Map();
    this.states = new Map();
  }

  canExecute(serviceName) {
    const state = this.states.get(serviceName) || 'CLOSED';
    
    if (state === 'CLOSED') return true;
    if (state === 'HALF_OPEN') return true;
    if (state === 'OPEN') {
      const failure = this.failures.get(serviceName);
      if (failure && Date.now() - failure.timestamp > this.timeout) {
        this.states.set(serviceName, 'HALF_OPEN');
        return true;
      }
      return false;
    }
    
    return true;
  }

  recordSuccess(serviceName) {
    this.failures.delete(serviceName);
    this.states.set(serviceName, 'CLOSED');
  }

  recordFailure(serviceName) {
    const current = this.failures.get(serviceName) || { count: 0, timestamp: Date.now() };
    current.count++;
    current.timestamp = Date.now();
    
    this.failures.set(serviceName, current);
    
    if (current.count >= this.threshold) {
      this.states.set(serviceName, 'OPEN');
    }
  }
}

export const enhancedTerraRustBridge = new EnhancedTerraRustBridge();
export { EnhancedTerraRustBridge };
export default enhancedTerraRustBridge;
