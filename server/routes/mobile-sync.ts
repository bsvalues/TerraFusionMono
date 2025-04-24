import { Request, Response, Router, NextFunction } from 'express';
import { storage } from '../storage';

const router = Router();

// In-memory store for sync status (in a real app, this would be in a database)
let syncStatus = {
  status: 'offline' as 'syncing' | 'synced' | 'offline' | 'error' | 'delayed',
  progress: 0,
  lastSynced: null as Date | null,
  pendingChanges: 0,
};

// Mock device list
const connectedDevices = [
  { 
    id: 'device-1',
    name: 'Field Tablet #1', 
    status: 'online', 
    lastSeen: new Date(),
    syncStatus: 'synced'
  }
];

// Temporarily disable authentication for demo purposes
const tempAuth = (req: Request, res: Response, next: NextFunction) => {
  next();
};

// Get current sync status
router.get('/status', tempAuth, (req: Request, res: Response) => {
  res.json(syncStatus);
});

// Get connected devices
router.get('/devices', tempAuth, (req: Request, res: Response) => {
  res.json({ devices: connectedDevices });
});

// Trigger a sync operation
router.post('/trigger', tempAuth, async (req: Request, res: Response) => {
  // Start syncing
  syncStatus = {
    ...syncStatus,
    status: 'syncing',
    progress: 0
  };
  
  // Log the sync initiation
  await storage.createLog({
    level: 'info',
    message: 'Mobile sync manually triggered by user',
    service: 'mobile-sync'
  });

  // Simulate sync progress
  const syncDuration = 3000; // 3 seconds
  const interval = 100; // Update every 100ms
  const steps = syncDuration / interval;
  let currentStep = 0;
  
  const progressInterval = setInterval(() => {
    currentStep++;
    const progress = Math.floor((currentStep / steps) * 100);
    
    syncStatus.progress = progress;
    
    if (progress >= 100) {
      clearInterval(progressInterval);
      
      // Sync complete
      syncStatus = {
        status: 'synced',
        progress: 100,
        lastSynced: new Date(),
        pendingChanges: 0
      };
      
      // Log the completion
      storage.createLog({
        level: 'info',
        message: 'Mobile sync completed successfully',
        service: 'mobile-sync'
      });
    }
  }, interval);
  
  res.json({ 
    success: true, 
    message: 'Sync started' 
  });
});

// Simulate error state
router.post('/simulate-error', tempAuth, async (req: Request, res: Response) => {
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
router.post('/simulate-delayed', tempAuth, async (req: Request, res: Response) => {
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
    pendingChanges: 0
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

export default router;