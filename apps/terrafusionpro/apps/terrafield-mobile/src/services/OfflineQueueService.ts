import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { NotificationService } from './NotificationService';
import { NotificationType } from './types';

/**
 * Operation types that can be performed offline
 */
export enum OperationType {
  CREATE_PROPERTY = 'CREATE_PROPERTY',
  UPDATE_PROPERTY = 'UPDATE_PROPERTY',
  CREATE_REPORT = 'CREATE_REPORT',
  UPDATE_REPORT = 'UPDATE_REPORT',
  UPLOAD_PHOTO = 'UPLOAD_PHOTO',
  ENHANCE_PHOTO = 'ENHANCE_PHOTO',
  UPDATE_PARCEL_NOTES = 'UPDATE_PARCEL_NOTES',
  SYNC_PARCEL_DATA = 'SYNC_PARCEL_DATA'
}

/**
 * Operation status in the queue
 */
export enum OperationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING'
}

/**
 * Structure of an operation in the queue
 */
export interface QueuedOperation {
  id: string;
  type: OperationType;
  data: any;
  status: OperationStatus;
  createdAt: Date;
  updatedAt: Date;
  retryCount: number;
  maxRetries: number;
  errors?: string[];
  priority: number; // Higher number = higher priority
}

/**
 * Result of a processed operation
 */
export interface OperationResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Retry strategy configuration
 */
export interface RetryStrategy {
  maxRetries: number;
  baseDelayMs: number; // Base delay for exponential backoff
  maxDelayMs: number;  // Maximum delay cap
}

/**
 * Handler function for processing operations
 */
export type OperationHandler = (operation: QueuedOperation) => Promise<OperationResult>;

/**
 * Service for managing operations performed offline
 */
export class OfflineQueueService {
  private static instance: OfflineQueueService;
  private queue: QueuedOperation[] = [];
  private isProcessing: boolean = false;
  private isOnline: boolean = true;
  private handlers: Map<OperationType, OperationHandler> = new Map();
  private notificationService: NotificationService;
  private storageKey: string = '@terrafield:offline_queue';
  private retryStrategy: RetryStrategy = {
    maxRetries: 5,
    baseDelayMs: 1000, // 1 second
    maxDelayMs: 60000   // 1 minute
  };
  private autoSyncInterval: NodeJS.Timeout | null = null;
  
  private constructor() {
    this.notificationService = NotificationService.getInstance();
    this.monitorConnectivity();
    this.loadQueue();
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): OfflineQueueService {
    if (!OfflineQueueService.instance) {
      OfflineQueueService.instance = new OfflineQueueService();
    }
    return OfflineQueueService.instance;
  }
  
  /**
   * Register a handler for an operation type
   */
  public registerHandler(type: OperationType, handler: OperationHandler): void {
    this.handlers.set(type, handler);
    console.log(`Registered handler for operation type: ${type}`);
  }
  
  /**
   * Add an operation to the queue
   */
  public async enqueue(
    type: OperationType, 
    data: any, 
    priority: number = 1
  ): Promise<string> {
    const operation: QueuedOperation = {
      id: uuidv4(),
      type,
      data,
      status: OperationStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      retryCount: 0,
      maxRetries: this.retryStrategy.maxRetries,
      priority
    };
    
    this.queue.push(operation);
    
    // Sort queue by priority (higher first) and then by creation time (older first)
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    
    await this.saveQueue();
    
    // Notify about new operation in queue
    this.notificationService.sendNotification(
      1, // TODO: Get actual user ID
      NotificationType.OFFLINE_QUEUE_UPDATED,
      'Operation Added to Queue',
      `A new ${type} operation has been added to the offline queue.`,
      { operationId: operation.id }
    );
    
    // Try to process queue if we're online
    if (this.isOnline) {
      this.processQueue();
    }
    
    return operation.id;
  }
  
  /**
   * Get the current queue
   */
  public getQueue(): QueuedOperation[] {
    return [...this.queue];
  }
  
  /**
   * Get a specific operation by ID
   */
  public getOperation(id: string): QueuedOperation | undefined {
    return this.queue.find(op => op.id === id);
  }
  
  /**
   * Start processing the queue
   */
  public async processQueue(): Promise<void> {
    if (this.isProcessing || !this.isOnline || this.queue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      // Start sync notification
      this.notificationService.sendNotification(
        1, // TODO: Get actual user ID
        NotificationType.SYNC_STARTED,
        'Synchronizing Data',
        `Processing ${this.queue.length} pending operations.`
      );
      
      let successCount = 0;
      let failureCount = 0;
      
      // Process each operation in order
      for (const operation of this.queue.filter(op => op.status === OperationStatus.PENDING)) {
        const result = await this.processOperation(operation);
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
      }
      
      // Send completed notification
      if (failureCount === 0) {
        this.notificationService.sendNotification(
          1, // TODO: Get actual user ID
          NotificationType.SYNC_COMPLETED,
          'Synchronization Complete',
          `Successfully processed ${successCount} operations.`
        );
      } else {
        this.notificationService.sendNotification(
          1, // TODO: Get actual user ID
          NotificationType.SYNC_FAILED,
          'Synchronization Partially Failed',
          `Processed ${successCount} operations successfully, ${failureCount} operations failed.`
        );
      }
    } catch (error) {
      console.error('Error processing queue:', error);
      
      // Send failed notification
      this.notificationService.sendNotification(
        1, // TODO: Get actual user ID
        NotificationType.SYNC_FAILED,
        'Synchronization Failed',
        `Error processing operations: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      this.isProcessing = false;
      await this.saveQueue();
    }
  }
  
  /**
   * Process a single operation
   */
  private async processOperation(operation: QueuedOperation): Promise<OperationResult> {
    const handler = this.handlers.get(operation.type);
    
    if (!handler) {
      const error = `No handler registered for operation type: ${operation.type}`;
      console.error(error);
      
      operation.status = OperationStatus.FAILED;
      operation.updatedAt = new Date();
      operation.errors = [...(operation.errors || []), error];
      
      await this.saveQueue();
      
      return { success: false, error };
    }
    
    try {
      // Update operation status
      operation.status = OperationStatus.IN_PROGRESS;
      operation.updatedAt = new Date();
      await this.saveQueue();
      
      // Process the operation
      const result = await handler(operation);
      
      if (result.success) {
        // Operation succeeded
        operation.status = OperationStatus.COMPLETED;
        operation.updatedAt = new Date();
        
        // Remove completed operation from queue
        this.queue = this.queue.filter(op => op.id !== operation.id);
      } else {
        // Operation failed
        if (operation.retryCount < operation.maxRetries) {
          // Will retry later
          operation.status = OperationStatus.RETRYING;
          operation.retryCount++;
          operation.errors = [...(operation.errors || []), result.error || 'Unknown error'];
          
          // Schedule retry with exponential backoff
          const delay = Math.min(
            this.retryStrategy.baseDelayMs * Math.pow(2, operation.retryCount - 1),
            this.retryStrategy.maxDelayMs
          );
          
          setTimeout(() => {
            if (this.isOnline) {
              this.processOperation(operation);
            }
          }, delay);
        } else {
          // Max retries exceeded
          operation.status = OperationStatus.FAILED;
          operation.errors = [...(operation.errors || []), result.error || 'Max retries exceeded'];
          
          // Send notification about failed operation
          this.notificationService.sendNotification(
            1, // TODO: Get actual user ID
            NotificationType.SYNC_FAILED,
            'Operation Failed',
            `Failed to process ${operation.type} after ${operation.maxRetries} attempts.`,
            { operationId: operation.id, type: operation.type }
          );
        }
      }
      
      operation.updatedAt = new Date();
      await this.saveQueue();
      
      return result;
    } catch (error) {
      // Unexpected error
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error processing operation ${operation.id}:`, errorMessage);
      
      operation.status = OperationStatus.FAILED;
      operation.updatedAt = new Date();
      operation.errors = [...(operation.errors || []), errorMessage];
      
      await this.saveQueue();
      
      return { success: false, error: errorMessage };
    }
  }
  
  /**
   * Retry a failed operation
   */
  public async retryOperation(id: string): Promise<boolean> {
    const operation = this.queue.find(op => op.id === id);
    
    if (!operation || ![OperationStatus.FAILED, OperationStatus.RETRYING].includes(operation.status)) {
      return false;
    }
    
    // Reset retry count and status
    operation.retryCount = 0;
    operation.status = OperationStatus.PENDING;
    operation.updatedAt = new Date();
    
    await this.saveQueue();
    
    // Try to process if online
    if (this.isOnline) {
      this.processQueue();
    }
    
    return true;
  }
  
  /**
   * Retry all failed operations
   */
  public async retryAllFailedOperations(): Promise<number> {
    let count = 0;
    
    for (const operation of this.queue) {
      if ([OperationStatus.FAILED, OperationStatus.RETRYING].includes(operation.status)) {
        operation.retryCount = 0;
        operation.status = OperationStatus.PENDING;
        operation.updatedAt = new Date();
        count++;
      }
    }
    
    if (count > 0) {
      await this.saveQueue();
      
      // Try to process if online
      if (this.isOnline) {
        this.processQueue();
      }
    }
    
    return count;
  }
  
  /**
   * Remove an operation from the queue
   */
  public async removeOperation(id: string): Promise<boolean> {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(op => op.id !== id);
    
    if (this.queue.length !== initialLength) {
      await this.saveQueue();
      return true;
    }
    
    return false;
  }
  
  /**
   * Clear all completed operations
   */
  public async clearCompletedOperations(): Promise<number> {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(op => op.status !== OperationStatus.COMPLETED);
    
    const removedCount = initialLength - this.queue.length;
    
    if (removedCount > 0) {
      await this.saveQueue();
    }
    
    return removedCount;
  }
  
  /**
   * Start auto sync with specified interval
   */
  public startAutoSync(intervalMs: number = 60000): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }
    
    this.autoSyncInterval = setInterval(() => {
      if (this.isOnline && !this.isProcessing && this.queue.length > 0) {
        this.processQueue();
      }
    }, intervalMs);
    
    console.log(`Auto sync started with interval: ${intervalMs}ms`);
  }
  
  /**
   * Stop auto sync
   */
  public stopAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
      console.log('Auto sync stopped');
    }
  }
  
  /**
   * Set the retry strategy
   */
  public setRetryStrategy(strategy: Partial<RetryStrategy>): void {
    this.retryStrategy = { ...this.retryStrategy, ...strategy };
    console.log('Retry strategy updated:', this.retryStrategy);
  }
  
  /**
   * Monitor network connectivity changes
   */
  private monitorConnectivity(): void {
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      // If we just came online and we have pending operations, process the queue
      if (!wasOnline && this.isOnline && this.queue.length > 0) {
        console.log('Device is online. Processing pending operations...');
        this.processQueue();
      }
    });
  }
  
  /**
   * Load the queue from persistent storage
   */
  private async loadQueue(): Promise<void> {
    try {
      const queueJson = await AsyncStorage.getItem(this.storageKey);
      
      if (queueJson) {
        const parsedQueue: QueuedOperation[] = JSON.parse(queueJson);
        
        // Convert string dates back to Date objects
        this.queue = parsedQueue.map(op => ({
          ...op,
          createdAt: new Date(op.createdAt),
          updatedAt: new Date(op.updatedAt)
        }));
        
        console.log(`Loaded ${this.queue.length} operations from storage`);
        
        // Process pending operations if we're online
        if (this.isOnline && this.queue.length > 0) {
          this.processQueue();
        }
      }
    } catch (error) {
      console.error('Error loading queue from storage:', error);
    }
  }
  
  /**
   * Save the queue to persistent storage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error saving queue to storage:', error);
    }
  }
}