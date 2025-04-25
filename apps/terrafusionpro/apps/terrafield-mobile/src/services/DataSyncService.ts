import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { OfflineQueueService, OperationType } from './OfflineQueueService';
import { ConflictResolutionService, DataType } from './ConflictResolutionService';
import { NotificationService } from './NotificationService';
import { NotificationType, PropertyData, AppraisalReport, ComparableData } from './types';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebsocketProvider } from 'y-websocket';

// For now we'll use a constant API URL, but this would typically come from a config file
const API_URL = 'https://appraisalcore.replit.app';
const SYNC_INTERVAL_MS = 60000; // 1 minute

/**
 * This service handles synchronization of data between the mobile app and the server
 * using CRDT for conflict-free modifications
 */
export class DataSyncService {
  private static instance: DataSyncService;
  private ydoc: Y.Doc;
  private wsProvider: WebsocketProvider | null = null;
  private indexeddbProvider: IndexeddbPersistence | null = null;
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private offlineQueueService: OfflineQueueService;
  private conflictService: ConflictResolutionService;
  private notificationService: NotificationService;
  
  // Define CRDT shared types for different data
  public properties: Y.Map<PropertyData>;
  public reports: Y.Map<AppraisalReport>;
  public comparables: Y.Map<ComparableData>;
  
  // Store last sync timestamps
  private lastSyncTimes: Record<string, number> = {
    properties: 0,
    reports: 0,
    comparables: 0,
    photos: 0
  };
  
  private constructor() {
    // Initialize YJS document
    this.ydoc = new Y.Doc();
    
    // Initialize shared data types
    this.properties = this.ydoc.getMap('properties');
    this.reports = this.ydoc.getMap('reports');
    this.comparables = this.ydoc.getMap('comparables');
    
    // Initialize services
    this.offlineQueueService = OfflineQueueService.getInstance();
    this.conflictService = ConflictResolutionService.getInstance();
    this.notificationService = NotificationService.getInstance();
    
    // Initialize providers
    this.setupPersistence();
    
    // Monitor connectivity
    this.monitorConnectivity();
    
    // Load last sync times
    this.loadLastSyncTimes();
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }
  
  /**
   * Set up CRDT persistence providers
   */
  private setupPersistence() {
    try {
      // IndexedDB for offline persistence
      this.indexeddbProvider = new IndexeddbPersistence('terrafield-data', this.ydoc);
      
      this.indexeddbProvider.on('synced', () => {
        console.log('Data loaded from IndexedDB');
      });
      
      // WebSocket for real-time sync when online
      this.connectWebsocket();
    } catch (error) {
      console.error('Error setting up CRDT persistence:', error);
    }
  }
  
  /**
   * Connect to the WebSocket server for real-time sync
   */
  private connectWebsocket() {
    if (!this.isOnline) return;
    
    try {
      // Close existing connection if any
      if (this.wsProvider) {
        this.wsProvider.disconnect();
        this.wsProvider.destroy();
        this.wsProvider = null;
      }
      
      // Connect to the WebSocket server
      this.wsProvider = new WebsocketProvider(
        `${API_URL.replace('http', 'ws')}/crdt`,
        'terrafield-data',
        this.ydoc
      );
      
      this.wsProvider.on('status', (event: { status: string }) => {
        console.log('WebSocket connection status:', event.status);
        
        if (event.status === 'connected') {
          console.log('Connected to CRDT server, syncing data...');
          this.notificationService.sendNotification(
            1, // TODO: Get actual user ID
            NotificationType.SYNC_STARTED,
            'Data Sync Started',
            'Connecting to server for real-time data synchronization.'
          );
        }
      });
      
      this.wsProvider.on('sync', (isSynced: boolean) => {
        if (isSynced) {
          console.log('Initial data sync completed');
          this.notificationService.sendNotification(
            1, // TODO: Get actual user ID 
            NotificationType.SYNC_COMPLETED,
            'Data Sync Completed',
            'Your data is now synchronized with the server.'
          );
          
          // Update last sync times
          const now = Date.now();
          Object.keys(this.lastSyncTimes).forEach(key => {
            this.lastSyncTimes[key] = now;
          });
          this.saveLastSyncTimes();
        }
      });
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }
  
  /**
   * Monitor network connectivity changes
   */
  private monitorConnectivity() {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (!wasOnline && this.isOnline) {
        // Just came online, reconnect WebSocket and sync data
        console.log('Device is now online, reconnecting...');
        this.connectWebsocket();
        this.syncDataWithServer();
      } else if (wasOnline && !this.isOnline) {
        // Just went offline, disconnect WebSocket
        console.log('Device is now offline, disconnecting...');
        if (this.wsProvider) {
          this.wsProvider.disconnect();
        }
        
        this.notificationService.sendNotification(
          1, // TODO: Get actual user ID
          NotificationType.SYSTEM,
          'Offline Mode',
          'You are now working offline. Changes will be synchronized when you reconnect.'
        );
      }
    });
  }
  
  /**
   * Start periodic synchronization with the server
   */
  public startPeriodicSync(intervalMs: number = SYNC_INTERVAL_MS) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncDataWithServer();
      }
    }, intervalMs);
    
    console.log(`Periodic sync started with interval: ${intervalMs}ms`);
  }
  
  /**
   * Stop periodic synchronization
   */
  public stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Periodic sync stopped');
    }
  }
  
  /**
   * Manually trigger synchronization with the server
   */
  public async syncDataWithServer() {
    if (!this.isOnline || this.isSyncing) return;
    
    this.isSyncing = true;
    
    try {
      console.log('Starting data sync with server...');
      
      this.notificationService.sendNotification(
        1, // TODO: Get actual user ID
        NotificationType.SYNC_STARTED,
        'Data Sync Started',
        'Synchronizing your data with the server.'
      );
      
      // Process any pending operations in the queue first
      await this.offlineQueueService.processQueue();
      
      // Sync each data type
      await Promise.all([
        this.syncProperties(),
        this.syncReports(),
        this.syncComparables()
      ]);
      
      // Update last sync times
      const now = Date.now();
      Object.keys(this.lastSyncTimes).forEach(key => {
        this.lastSyncTimes[key] = now;
      });
      await this.saveLastSyncTimes();
      
      this.notificationService.sendNotification(
        1, // TODO: Get actual user ID
        NotificationType.SYNC_COMPLETED,
        'Data Sync Completed',
        'Your data has been successfully synchronized with the server.'
      );
      
      console.log('Data sync completed successfully');
    } catch (error) {
      console.error('Error syncing data with server:', error);
      
      this.notificationService.sendNotification(
        1, // TODO: Get actual user ID
        NotificationType.SYNC_FAILED,
        'Data Sync Failed',
        `There was a problem synchronizing your data: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      this.isSyncing = false;
    }
  }
  
  /**
   * Sync properties with the server
   */
  private async syncProperties() {
    try {
      // Fetch properties updated since last sync
      const lastSync = this.lastSyncTimes.properties;
      const response = await fetch(`${API_URL}/api/properties/sync?since=${lastSync}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Properties sync failed with status ${response.status}`);
      }
      
      const serverProperties = await response.json();
      console.log(`Received ${serverProperties.length} properties from server`);
      
      // Update local properties
      for (const serverProperty of serverProperties) {
        const propertyId = serverProperty.id;
        const localProperty = this.properties.get(propertyId);
        
        if (!localProperty) {
          // New property from server, just add it
          this.properties.set(propertyId, serverProperty);
        } else {
          // Check for conflicts
          const conflict = await this.conflictService.detectConflict(
            DataType.PROPERTY,
            propertyId,
            localProperty,
            serverProperty
          );
          
          if (conflict) {
            // Resolve conflict automatically
            const resolvedData = await this.conflictService.autoResolveConflict(conflict);
            if (resolvedData) {
              this.properties.set(propertyId, resolvedData);
            }
          } else {
            // No conflict, update with server version
            this.properties.set(propertyId, serverProperty);
          }
        }
      }
      
      // Push local properties to server
      // We're sending only properties updated locally since last sync
      const localUpdates: PropertyData[] = [];
      this.properties.forEach((property, key) => {
        const lastModified = new Date(property.lastModified).getTime();
        if (lastModified > lastSync) {
          localUpdates.push(property);
        }
      });
      
      if (localUpdates.length > 0) {
        console.log(`Sending ${localUpdates.length} local property updates to server`);
        
        // Push updates to server
        const updateResponse = await fetch(`${API_URL}/api/properties/batch`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(localUpdates),
        });
        
        if (!updateResponse.ok) {
          throw new Error(`Sending local property updates failed with status ${updateResponse.status}`);
        }
        
        console.log('Local property updates sent successfully');
      }
    } catch (error) {
      console.error('Error syncing properties:', error);
      throw error;
    }
  }
  
  /**
   * Sync appraisal reports with the server
   */
  private async syncReports() {
    try {
      // Implementation similar to syncProperties but for reports
      const lastSync = this.lastSyncTimes.reports;
      const response = await fetch(`${API_URL}/api/reports/sync?since=${lastSync}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Reports sync failed with status ${response.status}`);
      }
      
      const serverReports = await response.json();
      console.log(`Received ${serverReports.length} reports from server`);
      
      // Update local reports with server data
      // (Conflict detection and resolution logic similar to properties)
      // ...
      
      // Send local updates to server
      // ...
    } catch (error) {
      console.error('Error syncing reports:', error);
      throw error;
    }
  }
  
  /**
   * Sync comparable properties with the server
   */
  private async syncComparables() {
    try {
      // Implementation similar to syncProperties but for comparables
      const lastSync = this.lastSyncTimes.comparables;
      const response = await fetch(`${API_URL}/api/comparables/sync?since=${lastSync}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Comparables sync failed with status ${response.status}`);
      }
      
      const serverComparables = await response.json();
      console.log(`Received ${serverComparables.length} comparables from server`);
      
      // Update local comparables with server data
      // (Conflict detection and resolution logic similar to properties)
      // ...
      
      // Send local updates to server
      // ...
    } catch (error) {
      console.error('Error syncing comparables:', error);
      throw error;
    }
  }
  
  /**
   * Add a property to the local CRDT store
   */
  public addProperty(property: PropertyData): string {
    if (!property.id) {
      property.id = uuidv4();
    }
    
    // Ensure timestamps are set
    if (!property.createdAt) {
      property.createdAt = new Date();
    }
    property.lastModified = new Date();
    
    // Add to CRDT
    this.properties.set(property.id, property);
    
    // If offline, queue this operation
    if (!this.isOnline) {
      this.offlineQueueService.enqueue(
        OperationType.CREATE_PROPERTY,
        property,
        2 // High priority
      );
    }
    
    return property.id;
  }
  
  /**
   * Update a property in the local CRDT store
   */
  public updateProperty(property: PropertyData): void {
    if (!property.id) {
      throw new Error('Property ID is required for updates');
    }
    
    // Update last modified time
    property.lastModified = new Date();
    
    // Update in CRDT
    this.properties.set(property.id, property);
    
    // If offline, queue this operation
    if (!this.isOnline) {
      this.offlineQueueService.enqueue(
        OperationType.UPDATE_PROPERTY,
        property,
        2 // High priority
      );
    }
  }
  
  /**
   * Get a property from the local CRDT store
   */
  public getProperty(id: string): PropertyData | undefined {
    return this.properties.get(id);
  }
  
  /**
   * Get all properties from the local CRDT store
   */
  public getAllProperties(): PropertyData[] {
    const result: PropertyData[] = [];
    this.properties.forEach((property) => {
      result.push(property);
    });
    return result;
  }
  
  /**
   * Add a report to the local CRDT store
   */
  public addReport(report: AppraisalReport): string {
    if (!report.id) {
      report.id = uuidv4();
    }
    
    // Ensure timestamps are set
    if (!report.createdAt) {
      report.createdAt = new Date();
    }
    report.lastModified = new Date();
    
    // Add to CRDT
    this.reports.set(report.id, report);
    
    // If offline, queue this operation
    if (!this.isOnline) {
      this.offlineQueueService.enqueue(
        OperationType.CREATE_REPORT,
        report,
        2 // High priority
      );
    }
    
    return report.id;
  }
  
  /**
   * Update a report in the local CRDT store
   */
  public updateReport(report: AppraisalReport): void {
    if (!report.id) {
      throw new Error('Report ID is required for updates');
    }
    
    // Update last modified time
    report.lastModified = new Date();
    
    // Update in CRDT
    this.reports.set(report.id, report);
    
    // If offline, queue this operation
    if (!this.isOnline) {
      this.offlineQueueService.enqueue(
        OperationType.UPDATE_REPORT,
        report,
        2 // High priority
      );
    }
  }
  
  /**
   * Get a report from the local CRDT store
   */
  public getReport(id: string): AppraisalReport | undefined {
    return this.reports.get(id);
  }
  
  /**
   * Get all reports from the local CRDT store
   */
  public getAllReports(): AppraisalReport[] {
    const result: AppraisalReport[] = [];
    this.reports.forEach((report) => {
      result.push(report);
    });
    return result;
  }
  
  /**
   * Load last sync times from persistent storage
   */
  private async loadLastSyncTimes() {
    try {
      const syncTimesJson = await AsyncStorage.getItem('@terrafield:last_sync_times');
      if (syncTimesJson) {
        this.lastSyncTimes = JSON.parse(syncTimesJson);
        console.log('Loaded last sync times:', this.lastSyncTimes);
      }
    } catch (error) {
      console.error('Error loading last sync times:', error);
    }
  }
  
  /**
   * Save last sync times to persistent storage
   */
  private async saveLastSyncTimes() {
    try {
      await AsyncStorage.setItem('@terrafield:last_sync_times', JSON.stringify(this.lastSyncTimes));
    } catch (error) {
      console.error('Error saving last sync times:', error);
    }
  }
  
  /**
   * Force a full sync with the server, ignoring last sync times
   */
  public async forceFullSync() {
    // Reset last sync times to 0 to force a full sync
    Object.keys(this.lastSyncTimes).forEach(key => {
      this.lastSyncTimes[key] = 0;
    });
    
    // Perform sync
    await this.syncDataWithServer();
  }
  
  /**
   * Clear all local data (for testing or account reset)
   */
  public async clearAllData() {
    // Clear CRDT data
    this.properties.clear();
    this.reports.clear();
    this.comparables.clear();
    
    // Reset last sync times
    Object.keys(this.lastSyncTimes).forEach(key => {
      this.lastSyncTimes[key] = 0;
    });
    await this.saveLastSyncTimes();
    
    console.log('All local data cleared');
  }
}