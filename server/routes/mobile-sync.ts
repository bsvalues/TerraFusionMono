import { Request, Response, Router, NextFunction } from 'express';
import { storage } from '../storage';
import { db } from '../db';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Sync status types
export type SyncStatus = 'syncing' | 'synced' | 'offline' | 'error' | 'delayed';
export type DeviceStatus = 'online' | 'offline' | 'synchronizing' | 'error';
export type SyncOperation = 'pull' | 'push' | 'bidirectional';
export type SyncPriority = 'low' | 'medium' | 'high' | 'critical';

// Sync status with expanded metadata
let syncStatus = {
  status: 'offline' as SyncStatus,
  progress: 0,
  lastSynced: null as Date | null,
  pendingChanges: 0,
  activeOperations: 0,
  syncQueue: 0,
  totalBytes: 0,
  totalSyncedBytes: 0,
};

// Enhanced device tracking with detailed metrics
const connectedDevices = [
  { 
    id: 'device-1',
    uuid: uuidv4(),
    name: 'Field Tablet #1', 
    status: 'online' as DeviceStatus, 
    lastSeen: new Date(),
    firstSeen: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    syncStatus: 'synced' as SyncStatus,
    batteryLevel: 85,
    storageUsed: 2.4, // GB
    pendingUploads: 0,
    pendingDownloads: 0,
    lastLocation: {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    },
    connectionType: 'wifi',
    osVersion: 'Android 13',
    appVersion: '1.5.2',
    syncHistory: [
      {
        id: uuidv4(),
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        status: 'completed',
        duration: 45, // seconds
        bytesTransferred: 12500000,
        recordsProcessed: 128,
        operation: 'bidirectional' as SyncOperation
      },
      {
        id: uuidv4(),
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        status: 'completed',
        duration: 67, // seconds
        bytesTransferred: 18700000,
        recordsProcessed: 215,
        operation: 'push' as SyncOperation
      }
    ]
  },
  { 
    id: 'device-2',
    uuid: uuidv4(),
    name: 'Field Smartphone #3', 
    status: 'offline' as DeviceStatus, 
    lastSeen: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    firstSeen: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    syncStatus: 'delayed' as SyncStatus,
    batteryLevel: 42,
    storageUsed: 1.8, // GB
    pendingUploads: 12,
    pendingDownloads: 3,
    lastLocation: {
      latitude: 37.3382,
      longitude: -121.8863,
      accuracy: 15,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    },
    connectionType: 'cellular',
    osVersion: 'iOS 17.2',
    appVersion: '1.5.1',
    syncHistory: [
      {
        id: uuidv4(),
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        status: 'partial',
        duration: 34, // seconds
        bytesTransferred: 8200000,
        recordsProcessed: 76,
        operation: 'pull' as SyncOperation
      }
    ]
  }
];

// Temporarily disable authentication for demo purposes
const tempAuth = (req: Request, res: Response, next: NextFunction) => {
  next();
};

// Get current sync status
router.get('/status', (req: Request, res: Response) => {
  console.log('Mobile sync status endpoint accessed');
  res.json(syncStatus);
});

// Get connected devices
router.get('/devices', (req: Request, res: Response) => {
  console.log('Mobile devices endpoint accessed');
  res.json({ devices: connectedDevices });
});

// Trigger a sync operation
router.post('/trigger', async (req: Request, res: Response) => {
  console.log('Mobile sync trigger endpoint accessed');
  
  // Extract operation type and device ID from request (optional)
  const { operationType = 'bidirectional', deviceId = 'all', priority = 'medium' } = req.body as {
    operationType?: SyncOperation,
    deviceId?: string,
    priority?: SyncPriority
  };
  
  // Calculate total pending changes across all devices
  const totalPendingChanges = connectedDevices.reduce((sum, device) => 
    sum + device.pendingUploads + device.pendingDownloads, 0);
  
  // Calculate estimated bytes to sync
  const estimatedBytesPerChange = 100 * 1024; // 100KB average per record
  const totalBytesToSync = totalPendingChanges * estimatedBytesPerChange;
  
  // Start syncing process
  syncStatus = {
    ...syncStatus,
    status: 'syncing',
    progress: 0,
    pendingChanges: totalPendingChanges,
    activeOperations: 1,
    syncQueue: deviceId === 'all' ? connectedDevices.filter(d => d.status === 'online').length : 1,
    totalBytes: totalBytesToSync,
    totalSyncedBytes: 0
  };
  
  // Log the sync initiation with details
  await storage.createLog({
    level: 'info',
    message: `Mobile sync manually triggered. Type: ${operationType}, Priority: ${priority}, ` +
             `Target: ${deviceId === 'all' ? 'All Devices' : `Device ${deviceId}`}`,
    service: 'mobile-sync'
  });

  // Simulate sync progress with more realistic patterns
  const syncDuration = 5000; // 5 seconds total
  const interval = 100; // Update every 100ms
  const steps = syncDuration / interval;
  let currentStep = 0;
  
  // Add randomization to create more realistic sync behavior
  // We'll use a sigmoid-like curve for progress to simulate slow-fast-slow pattern
  const progressInterval = setInterval(() => {
    currentStep++;
    
    // Calculate progress using sigmoid-like curve for more realistic sync pattern
    // Start slow, accelerate in middle, slow down at end
    const normalizedStep = currentStep / steps;
    const sigmoidProgress = 1 / (1 + Math.exp(-12 * (normalizedStep - 0.5)));
    const progress = Math.floor(sigmoidProgress * 100);
    
    // Calculate bytes synced based on progress
    const bytesSynced = Math.floor(totalBytesToSync * sigmoidProgress);
    
    // Update sync status with current progress values
    syncStatus = {
      ...syncStatus,
      progress,
      totalSyncedBytes: bytesSynced
    };
    
    // Randomly update device status during sync to simulate real devices
    if (currentStep % 5 === 0 && connectedDevices.length > 0) {
      const randomDeviceIndex = Math.floor(Math.random() * connectedDevices.length);
      const device = connectedDevices[randomDeviceIndex];
      
      // Only modify online devices
      if (device.status === 'online') {
        device.status = 'synchronizing';
        device.syncStatus = 'syncing';
        device.lastSeen = new Date();
        
        // Simulate gradual reduction of pending uploads/downloads
        if (device.pendingUploads > 0 && Math.random() > 0.5) {
          const reduction = Math.min(device.pendingUploads, Math.ceil(device.pendingUploads * normalizedStep / 2));
          device.pendingUploads -= reduction;
        }
        
        if (device.pendingDownloads > 0 && Math.random() > 0.5) {
          const reduction = Math.min(device.pendingDownloads, Math.ceil(device.pendingDownloads * normalizedStep / 2));
          device.pendingDownloads -= reduction;
        }
      }
    }
    
    // Complete sync when we reach 100%
    if (progress >= 100) {
      clearInterval(progressInterval);
      
      // Update device statuses after completion
      connectedDevices.forEach(device => {
        if (device.status === 'synchronizing') {
          device.status = 'online';
          device.syncStatus = 'synced';
          device.lastSeen = new Date();
          
          // Add sync history entry
          const syncRecord = {
            id: uuidv4(),
            timestamp: new Date(),
            status: 'completed',
            duration: syncDuration / 1000, // in seconds
            bytesTransferred: totalBytesToSync / connectedDevices.length, // approximate per device
            recordsProcessed: totalPendingChanges / connectedDevices.length, // approximate per device
            operation: operationType
          };
          
          device.syncHistory = [syncRecord, ...(device.syncHistory || []).slice(0, 9)]; // Keep last 10
          device.pendingUploads = 0;
          device.pendingDownloads = 0;
        }
      });
      
      // Sync complete - update the status
      syncStatus = {
        ...syncStatus,
        status: 'synced',
        progress: 100,
        lastSynced: new Date(),
        pendingChanges: 0,
        activeOperations: 0,
        syncQueue: 0,
        totalSyncedBytes: totalBytesToSync
      };
      
      // Log the completion with metrics
      storage.createLog({
        level: 'info',
        message: `Mobile sync completed successfully. Synchronized ${totalPendingChanges} records (${Math.round(totalBytesToSync / 1024 / 1024 * 100) / 100} MB)`,
        service: 'mobile-sync'
      });
    }
  }, interval);
  
  res.json({ 
    success: true, 
    message: `Sync started for ${deviceId === 'all' ? 'all devices' : `device ${deviceId}`}`,
    operation: {
      type: operationType,
      priority,
      estimatedRecords: totalPendingChanges,
      estimatedSizeBytes: totalBytesToSync
    }
  });
});

// Simulate error state
router.post('/simulate-error', async (req: Request, res: Response) => {
  console.log('Mobile sync error simulation endpoint accessed');
  syncStatus = {
    ...syncStatus,
    status: 'error',
    progress: 0
  };
  
  await storage.createLog({
    level: 'error',
    message: 'Mobile sync error simulated by user',
    service: 'mobile-sync'
  });
  
  res.json({ 
    success: true, 
    message: 'Error state simulated' 
  });
});

// Simulate delayed state
router.post('/simulate-delayed', async (req: Request, res: Response) => {
  console.log('Mobile sync delayed state endpoint accessed');
  syncStatus = {
    ...syncStatus,
    status: 'delayed',
    pendingChanges: Math.floor(Math.random() * 20) + 5
  };
  
  await storage.createLog({
    level: 'warn',
    message: 'Mobile sync delayed state simulated by user',
    service: 'mobile-sync'
  });
  
  res.json({ 
    success: true, 
    message: 'Delayed state simulated' 
  });
});

// Reset to synced state
router.post('/reset', tempAuth, async (req: Request, res: Response) => {
  syncStatus = {
    status: 'synced',
    progress: 100,
    lastSynced: new Date(),
    pendingChanges: 0,
    activeOperations: 0,
    syncQueue: 0,
    totalBytes: syncStatus.totalBytes || 0,
    totalSyncedBytes: syncStatus.totalBytes || 0
  };
  
  await storage.createLog({
    level: 'info',
    message: 'Mobile sync status reset to synced',
    service: 'mobile-sync'
  });
  
  res.json({ 
    success: true, 
    message: 'Status reset to synced' 
  });
});

// Get detailed device information by ID
router.get('/devices/:id', (req: Request, res: Response) => {
  const deviceId = req.params.id;
  const device = connectedDevices.find(d => d.id === deviceId);
  
  if (!device) {
    return res.status(404).json({ 
      success: false, 
      message: `Device with ID ${deviceId} not found` 
    });
  }
  
  console.log(`Mobile device details accessed for device ${deviceId}`);
  res.json({ 
    success: true, 
    device 
  });
});

// Get device sync history
router.get('/devices/:id/history', (req: Request, res: Response) => {
  const deviceId = req.params.id;
  const device = connectedDevices.find(d => d.id === deviceId);
  
  if (!device) {
    return res.status(404).json({ 
      success: false, 
      message: `Device with ID ${deviceId} not found` 
    });
  }
  
  console.log(`Mobile device sync history accessed for device ${deviceId}`);
  res.json({ 
    success: true, 
    deviceId,
    deviceName: device.name,
    syncHistory: device.syncHistory || [] 
  });
});

// Register a new mobile device
router.post('/devices/register', async (req: Request, res: Response) => {
  const { name, osVersion, appVersion, connectionType } = req.body;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Device name is required'
    });
  }
  
  // Generate a new device ID and UUID
  const id = `device-${Date.now().toString(36)}`;
  const uuid = uuidv4();
  
  // Create new device object
  const newDevice = {
    id,
    uuid,
    name,
    status: 'online' as DeviceStatus,
    lastSeen: new Date(),
    firstSeen: new Date(),
    syncStatus: 'synced' as SyncStatus,
    batteryLevel: 100,
    storageUsed: 0,
    pendingUploads: 0,
    pendingDownloads: 0,
    lastLocation: {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10,
      timestamp: new Date()
    },
    connectionType: connectionType || 'wifi',
    osVersion: osVersion || 'Unknown',
    appVersion: appVersion || 'Unknown',
    syncHistory: []
  };
  
  // Add to connected devices
  connectedDevices.push(newDevice);
  
  // Log the device registration
  await storage.createLog({
    level: 'info',
    message: `New mobile device registered: ${name} (${id})`,
    service: 'mobile-sync'
  });
  
  console.log(`New mobile device registered: ${id}`);
  res.status(201).json({
    success: true,
    message: 'Device registered successfully',
    device: newDevice
  });
});

// Update device status
router.post('/devices/:id/status', async (req: Request, res: Response) => {
  const deviceId = req.params.id;
  const { status, batteryLevel, connectionType, location } = req.body;
  
  const device = connectedDevices.find(d => d.id === deviceId);
  
  if (!device) {
    return res.status(404).json({ 
      success: false, 
      message: `Device with ID ${deviceId} not found` 
    });
  }
  
  // Update device fields
  if (status) {
    device.status = status;
  }
  
  if (batteryLevel !== undefined) {
    device.batteryLevel = parseInt(batteryLevel, 10);
  }
  
  if (connectionType) {
    device.connectionType = connectionType;
  }
  
  if (location) {
    device.lastLocation = {
      ...location,
      timestamp: new Date()
    };
  }
  
  device.lastSeen = new Date();
  
  console.log(`Mobile device status updated for device ${deviceId}`);
  
  // Log low battery warning if applicable
  if (device.batteryLevel && device.batteryLevel < 20) {
    await storage.createLog({
      level: 'warn',
      message: `Low battery warning for device ${device.name} (${device.batteryLevel}%)`,
      service: 'mobile-sync'
    });
  }
  
  res.json({
    success: true,
    message: 'Device status updated',
    device
  });
});

// Get sync metrics
router.get('/metrics', (req: Request, res: Response) => {
  // Calculate various metrics
  const onlineDevices = connectedDevices.filter(d => d.status === 'online' || d.status === 'synchronizing').length;
  const offlineDevices = connectedDevices.filter(d => d.status === 'offline').length;
  const devicesWithErrors = connectedDevices.filter(d => d.status === 'error').length;
  
  const totalPendingUploads = connectedDevices.reduce((sum, d) => sum + d.pendingUploads, 0);
  const totalPendingDownloads = connectedDevices.reduce((sum, d) => sum + d.pendingDownloads, 0);
  
  // Get total sync operations in the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const syncOperations24h = connectedDevices.reduce((sum, device) => {
    return sum + (device.syncHistory || []).filter(h => 
      new Date(h.timestamp) > oneDayAgo
    ).length;
  }, 0);
  
  // Calculate total bytes transferred in the last 24 hours
  const bytesTransferred24h = connectedDevices.reduce((sum, device) => {
    return sum + (device.syncHistory || [])
      .filter(h => new Date(h.timestamp) > oneDayAgo)
      .reduce((histSum, h) => histSum + h.bytesTransferred, 0);
  }, 0);
  
  console.log('Mobile sync metrics accessed');
  res.json({
    success: true,
    metrics: {
      devices: {
        total: connectedDevices.length,
        online: onlineDevices,
        offline: offlineDevices,
        withErrors: devicesWithErrors
      },
      pending: {
        uploads: totalPendingUploads,
        downloads: totalPendingDownloads,
        total: totalPendingUploads + totalPendingDownloads
      },
      syncOperations: {
        last24h: syncOperations24h,
        bytesTransferred24h,
        activeOperations: syncStatus.activeOperations,
        queuedOperations: syncStatus.syncQueue
      },
      currentStatus: syncStatus.status,
      lastSynced: syncStatus.lastSynced
    }
  });
});

export default router;