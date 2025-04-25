import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationService } from './NotificationService';
import { NotificationType } from './types';

/**
 * Different conflict resolution strategies
 */
export enum ConflictStrategy {
  CLIENT_WINS = 'CLIENT_WINS',
  SERVER_WINS = 'SERVER_WINS',
  MANUAL_RESOLUTION = 'MANUAL_RESOLUTION',
  MERGE = 'MERGE',
  LAST_MODIFIED_WINS = 'LAST_MODIFIED_WINS'
}

/**
 * Types of data that can have conflicts
 */
export enum DataType {
  PROPERTY = 'PROPERTY',
  APPRAISAL_REPORT = 'APPRAISAL_REPORT',
  COMPARABLE = 'COMPARABLE',
  PHOTO = 'PHOTO',
  SKETCH = 'SKETCH',
  PARCEL_NOTE = 'PARCEL_NOTE',
  USER_PREFERENCE = 'USER_PREFERENCE'
}

/**
 * Status of a conflict
 */
export enum ConflictStatus {
  DETECTED = 'DETECTED',
  RESOLVED = 'RESOLVED',
  PENDING_MANUAL_RESOLUTION = 'PENDING_MANUAL_RESOLUTION',
  FAILED = 'FAILED'
}

/**
 * Structure of a detected conflict
 */
export interface DataConflict<T = any> {
  id: string;
  dataType: DataType;
  resourceId: string;
  clientVersion: T;
  serverVersion: T;
  status: ConflictStatus;
  detectedAt: Date;
  resolvedAt?: Date;
  strategy?: ConflictStrategy;
  resolutionData?: T;
  mergeFields?: string[];
}

/**
 * Handler for resolving conflicts based on strategy
 */
export type ConflictResolver<T = any> = (
  conflict: DataConflict<T>, 
  strategy: ConflictStrategy
) => Promise<T>;

/**
 * Custom field-level merger
 */
export type FieldMerger<T = any> = (
  field: string,
  clientValue: any,
  serverValue: any,
  clientData: T,
  serverData: T
) => any;

/**
 * Service for detecting and resolving data conflicts
 */
export class ConflictResolutionService {
  private static instance: ConflictResolutionService;
  private conflicts: Map<string, DataConflict> = new Map();
  private resolvers: Map<DataType, ConflictResolver> = new Map();
  private fieldMergers: Map<DataType, Map<string, FieldMerger>> = new Map();
  private defaultStrategy: Map<DataType, ConflictStrategy> = new Map();
  private notificationService: NotificationService;
  private storageKey: string = '@terrafield:conflicts';
  
  private constructor() {
    this.notificationService = NotificationService.getInstance();
    this.loadConflicts();
    
    // Set default strategies
    this.defaultStrategy.set(DataType.PROPERTY, ConflictStrategy.LAST_MODIFIED_WINS);
    this.defaultStrategy.set(DataType.APPRAISAL_REPORT, ConflictStrategy.MERGE);
    this.defaultStrategy.set(DataType.COMPARABLE, ConflictStrategy.SERVER_WINS);
    this.defaultStrategy.set(DataType.PHOTO, ConflictStrategy.CLIENT_WINS);
    this.defaultStrategy.set(DataType.SKETCH, ConflictStrategy.CLIENT_WINS);
    this.defaultStrategy.set(DataType.PARCEL_NOTE, ConflictStrategy.MERGE);
    this.defaultStrategy.set(DataType.USER_PREFERENCE, ConflictStrategy.CLIENT_WINS);
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): ConflictResolutionService {
    if (!ConflictResolutionService.instance) {
      ConflictResolutionService.instance = new ConflictResolutionService();
    }
    return ConflictResolutionService.instance;
  }
  
  /**
   * Register a resolver for a data type
   */
  public registerResolver<T>(dataType: DataType, resolver: ConflictResolver<T>): void {
    this.resolvers.set(dataType, resolver as ConflictResolver);
    console.log(`Registered resolver for data type: ${dataType}`);
  }
  
  /**
   * Register a field merger for a specific data type and field
   */
  public registerFieldMerger<T>(
    dataType: DataType,
    field: string,
    merger: FieldMerger<T>
  ): void {
    if (!this.fieldMergers.has(dataType)) {
      this.fieldMergers.set(dataType, new Map());
    }
    
    const typeFieldMergers = this.fieldMergers.get(dataType)!;
    typeFieldMergers.set(field, merger as FieldMerger);
    
    console.log(`Registered field merger for ${dataType}.${field}`);
  }
  
  /**
   * Set the default strategy for a data type
   */
  public setDefaultStrategy(dataType: DataType, strategy: ConflictStrategy): void {
    this.defaultStrategy.set(dataType, strategy);
  }
  
  /**
   * Detect a conflict between client and server versions
   */
  public async detectConflict<T>(
    dataType: DataType,
    resourceId: string,
    clientVersion: T,
    serverVersion: T,
    fieldComparer?: (field: string, clientValue: any, serverValue: any) => boolean
  ): Promise<DataConflict<T> | null> {
    // If data is identical, there's no conflict
    if (this.isEqual(clientVersion, serverVersion)) {
      return null;
    }
    
    // Check if we already have a conflict for this resource
    const existingConflictId = Array.from(this.conflicts.values())
      .find(c => c.dataType === dataType && c.resourceId === resourceId && c.status !== ConflictStatus.RESOLVED)
      ?.id;
    
    if (existingConflictId) {
      // Update existing conflict
      const existingConflict = this.conflicts.get(existingConflictId);
      if (existingConflict) {
        existingConflict.clientVersion = clientVersion;
        existingConflict.serverVersion = serverVersion;
        existingConflict.detectedAt = new Date();
        existingConflict.status = ConflictStatus.DETECTED;
        
        await this.saveConflicts();
        return existingConflict as DataConflict<T>;
      }
    }
    
    // Create a new conflict
    const conflict: DataConflict<T> = {
      id: `${dataType}-${resourceId}-${Date.now()}`,
      dataType,
      resourceId,
      clientVersion,
      serverVersion,
      status: ConflictStatus.DETECTED,
      detectedAt: new Date()
    };
    
    this.conflicts.set(conflict.id, conflict);
    await this.saveConflicts();
    
    // Notify about conflict
    this.notificationService.sendNotification(
      1, // TODO: Get actual user ID
      NotificationType.SYNC_FAILED,
      'Data Conflict Detected',
      `A conflict was detected for ${dataType} with ID ${resourceId}.`,
      { conflictId: conflict.id, dataType, resourceId }
    );
    
    return conflict;
  }
  
  /**
   * Auto-resolve a conflict using the default strategy
   */
  public async autoResolveConflict<T>(conflict: DataConflict<T>): Promise<T | null> {
    // Get default strategy for this data type
    const strategy = this.defaultStrategy.get(conflict.dataType) || ConflictStrategy.SERVER_WINS;
    
    // If strategy is manual resolution, mark as pending
    if (strategy === ConflictStrategy.MANUAL_RESOLUTION) {
      conflict.status = ConflictStatus.PENDING_MANUAL_RESOLUTION;
      await this.saveConflicts();
      
      // Notify user that manual resolution is required
      this.notificationService.sendNotification(
        1, // TODO: Get actual user ID
        NotificationType.SYNC_FAILED,
        'Manual Resolution Required',
        `A conflict requires manual resolution for ${conflict.dataType} with ID ${conflict.resourceId}.`,
        { conflictId: conflict.id, dataType: conflict.dataType, resourceId: conflict.resourceId }
      );
      
      return null;
    }
    
    return this.resolveConflict(conflict, strategy);
  }
  
  /**
   * Resolve a conflict using a specific strategy
   */
  public async resolveConflict<T>(
    conflict: DataConflict<T>,
    strategy: ConflictStrategy
  ): Promise<T | null> {
    try {
      let resolvedData: T;
      
      // Resolve based on strategy
      switch (strategy) {
        case ConflictStrategy.CLIENT_WINS:
          resolvedData = { ...conflict.clientVersion };
          break;
          
        case ConflictStrategy.SERVER_WINS:
          resolvedData = { ...conflict.serverVersion };
          break;
          
        case ConflictStrategy.LAST_MODIFIED_WINS:
          // Assume both versions have a 'updatedAt' field or similar
          const clientDate = this.getLastModifiedDate(conflict.clientVersion);
          const serverDate = this.getLastModifiedDate(conflict.serverVersion);
          
          resolvedData = clientDate > serverDate 
            ? { ...conflict.clientVersion }
            : { ...conflict.serverVersion };
          break;
          
        case ConflictStrategy.MERGE:
          resolvedData = await this.mergeData(
            conflict.dataType,
            conflict.clientVersion,
            conflict.serverVersion,
            conflict.mergeFields
          );
          break;
          
        case ConflictStrategy.MANUAL_RESOLUTION:
          conflict.status = ConflictStatus.PENDING_MANUAL_RESOLUTION;
          await this.saveConflicts();
          return null;
          
        default:
          throw new Error(`Unsupported conflict resolution strategy: ${strategy}`);
      }
      
      // Use custom resolver if available
      const resolver = this.resolvers.get(conflict.dataType);
      if (resolver) {
        resolvedData = await resolver(conflict, strategy) as T;
      }
      
      // Update conflict status
      conflict.status = ConflictStatus.RESOLVED;
      conflict.resolvedAt = new Date();
      conflict.strategy = strategy;
      conflict.resolutionData = resolvedData;
      
      await this.saveConflicts();
      
      // Notify about resolution
      this.notificationService.sendNotification(
        1, // TODO: Get actual user ID
        NotificationType.SYNC_COMPLETED,
        'Conflict Resolved',
        `A conflict for ${conflict.dataType} with ID ${conflict.resourceId} has been resolved.`,
        { conflictId: conflict.id, dataType: conflict.dataType, resourceId: conflict.resourceId }
      );
      
      return resolvedData;
    } catch (error) {
      console.error('Error resolving conflict:', error);
      
      conflict.status = ConflictStatus.FAILED;
      await this.saveConflicts();
      
      // Notify about failure
      this.notificationService.sendNotification(
        1, // TODO: Get actual user ID
        NotificationType.SYNC_FAILED,
        'Conflict Resolution Failed',
        `Failed to resolve conflict for ${conflict.dataType} with ID ${conflict.resourceId}.`,
        { conflictId: conflict.id, error: error instanceof Error ? error.message : String(error) }
      );
      
      return null;
    }
  }
  
  /**
   * Provide manual resolution data for a conflict
   */
  public async manuallyResolveConflict<T>(
    conflictId: string,
    resolutionData: T
  ): Promise<T | null> {
    const conflict = this.conflicts.get(conflictId) as DataConflict<T> | undefined;
    
    if (!conflict || conflict.status !== ConflictStatus.PENDING_MANUAL_RESOLUTION) {
      return null;
    }
    
    // Update conflict status
    conflict.status = ConflictStatus.RESOLVED;
    conflict.resolvedAt = new Date();
    conflict.strategy = ConflictStrategy.MANUAL_RESOLUTION;
    conflict.resolutionData = resolutionData;
    
    await this.saveConflicts();
    
    // Notify about resolution
    this.notificationService.sendNotification(
      1, // TODO: Get actual user ID
      NotificationType.SYNC_COMPLETED,
      'Conflict Manually Resolved',
      `A conflict for ${conflict.dataType} with ID ${conflict.resourceId} has been manually resolved.`,
      { conflictId: conflict.id, dataType: conflict.dataType, resourceId: conflict.resourceId }
    );
    
    return resolutionData;
  }
  
  /**
   * Get all conflicts
   */
  public getAllConflicts(): DataConflict[] {
    return Array.from(this.conflicts.values());
  }
  
  /**
   * Get conflicts by status
   */
  public getConflictsByStatus(status: ConflictStatus): DataConflict[] {
    return Array.from(this.conflicts.values()).filter(c => c.status === status);
  }
  
  /**
   * Get conflicts for a specific resource
   */
  public getConflictsForResource(dataType: DataType, resourceId: string): DataConflict[] {
    return Array.from(this.conflicts.values())
      .filter(c => c.dataType === dataType && c.resourceId === resourceId);
  }
  
  /**
   * Clear resolved conflicts
   */
  public async clearResolvedConflicts(): Promise<number> {
    const initialSize = this.conflicts.size;
    
    // Remove resolved conflicts
    for (const [id, conflict] of this.conflicts.entries()) {
      if (conflict.status === ConflictStatus.RESOLVED) {
        this.conflicts.delete(id);
      }
    }
    
    const removedCount = initialSize - this.conflicts.size;
    
    if (removedCount > 0) {
      await this.saveConflicts();
    }
    
    return removedCount;
  }
  
  /**
   * Merge data from client and server versions
   */
  private async mergeData<T>(
    dataType: DataType,
    clientData: T,
    serverData: T,
    specificFields?: string[]
  ): Promise<T> {
    // Start with server data as base
    const mergedData = { ...serverData };
    
    // Get all fields to merge
    const fields = specificFields || this.getAllFields(clientData, serverData);
    
    // Get type-specific field mergers
    const fieldMergers = this.fieldMergers.get(dataType) || new Map();
    
    // Merge each field
    for (const field of fields) {
      const clientValue = this.getFieldValue(clientData, field);
      const serverValue = this.getFieldValue(serverData, field);
      
      // Skip if values are equal
      if (this.isEqual(clientValue, serverValue)) {
        continue;
      }
      
      // Use custom field merger if available
      const fieldMerger = fieldMergers.get(field);
      if (fieldMerger) {
        const mergedValue = await fieldMerger(field, clientValue, serverValue, clientData, serverData);
        this.setFieldValue(mergedData, field, mergedValue);
        continue;
      }
      
      // Default merging logic based on types
      if (typeof clientValue === 'object' && clientValue !== null && 
          typeof serverValue === 'object' && serverValue !== null) {
        // Recursive merge for nested objects
        const nestedMerged = await this.mergeData(
          dataType,
          clientValue,
          serverValue
        );
        this.setFieldValue(mergedData, field, nestedMerged);
      } else {
        // For primitive types, prefer client value
        this.setFieldValue(mergedData, field, clientValue);
      }
    }
    
    return mergedData;
  }
  
  /**
   * Get all fields from two objects
   */
  private getAllFields(obj1: any, obj2: any): string[] {
    const fields = new Set<string>([
      ...Object.keys(obj1 || {}),
      ...Object.keys(obj2 || {})
    ]);
    return Array.from(fields);
  }
  
  /**
   * Get value of a field (supports nested fields with dot notation)
   */
  private getFieldValue(obj: any, field: string): any {
    if (!obj) return undefined;
    
    const parts = field.split('.');
    let value = obj;
    
    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }
    
    return value;
  }
  
  /**
   * Set value of a field (supports nested fields with dot notation)
   */
  private setFieldValue(obj: any, field: string, value: any): void {
    if (!obj) return;
    
    const parts = field.split('.');
    const lastPart = parts.pop()!;
    
    let current = obj;
    
    for (const part of parts) {
      if (current[part] === undefined || current[part] === null) {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[lastPart] = value;
  }
  
  /**
   * Check if two values are equal
   */
  private isEqual(a: any, b: any): boolean {
    // Simple equality check for now
    // Could be expanded with deep equality check for objects
    if (a === b) return true;
    
    if (a === null || b === null || a === undefined || b === undefined) {
      return false;
    }
    
    if (typeof a === 'object' && typeof b === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    
    return false;
  }
  
  /**
   * Extract last modified date from data
   */
  private getLastModifiedDate(data: any): Date {
    // Try common last modified field names
    const dateFields = ['updatedAt', 'lastModified', 'modifiedAt', 'modified'];
    
    for (const field of dateFields) {
      if (data && data[field]) {
        const dateValue = data[field];
        if (dateValue instanceof Date) {
          return dateValue;
        }
        if (typeof dateValue === 'string' || typeof dateValue === 'number') {
          return new Date(dateValue);
        }
      }
    }
    
    // Default to current time if no date field found
    return new Date();
  }
  
  /**
   * Load conflicts from storage
   */
  private async loadConflicts(): Promise<void> {
    try {
      const conflictsJson = await AsyncStorage.getItem(this.storageKey);
      
      if (conflictsJson) {
        const conflictsArray: DataConflict[] = JSON.parse(conflictsJson);
        
        // Convert string dates back to Date objects
        for (const conflict of conflictsArray) {
          conflict.detectedAt = new Date(conflict.detectedAt);
          if (conflict.resolvedAt) {
            conflict.resolvedAt = new Date(conflict.resolvedAt);
          }
          this.conflicts.set(conflict.id, conflict);
        }
        
        console.log(`Loaded ${this.conflicts.size} conflicts from storage`);
      }
    } catch (error) {
      console.error('Error loading conflicts from storage:', error);
    }
  }
  
  /**
   * Save conflicts to storage
   */
  private async saveConflicts(): Promise<void> {
    try {
      const conflictsArray = Array.from(this.conflicts.values());
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(conflictsArray));
    } catch (error) {
      console.error('Error saving conflicts to storage:', error);
    }
  }
}