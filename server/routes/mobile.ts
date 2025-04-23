import express from 'express';
import { storage } from '../storage';
import { verifyToken } from './auth';
import { mobileSyncService } from '../services/mobile-sync';

const router = express.Router();

/**
 * Mobile API routes
 * Provides endpoints for the TerraField mobile application
 */

// Ping endpoint - used to check connectivity from mobile app
router.get('/ping', (req, res) => {
  res.json({ 
    success: true,
    status: 'ok', 
    message: 'TerraFusion API is running', 
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0'
  });
});

// Auth validation endpoint - redirect to mobile auth routes
router.get('/auth/validate', verifyToken, (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user as any;
  res.json({ 
    success: true, 
    valid: true, 
    user: userWithoutPassword 
  });
});

// Get app configuration
router.get('/config', async (req, res) => {
  try {
    // Application configuration for mobile clients
    res.json({
      success: true,
      config: {
        syncInterval: 300000, // 5 minutes
        maxOfflineTime: 2592000000, // 30 days
        cacheExpiration: 86400000, // 24 hours
        features: {
          offlineEditing: true,
          gpsTracking: true,
          documentScanning: true,
          mapVisualization: true,
          crdt: true
        },
        version: process.env.API_VERSION || '1.0.0',
        minClientVersion: '1.0.0'
      }
    });
  } catch (error: any) {
    console.error('Get config error:', error);
    res.status(500).json({ 
      success: false,
      message: `Server error: ${error.message}` 
    });
  }
});

// Get parcels endpoint - with optional filtering and pagination
router.get('/parcels', verifyToken, async (req, res) => {
  try {
    const user = req.user as any;
    const { limit = 50, page = 1 } = req.query;
    
    // Get parcels associated with the user
    const parcels = await storage.getParcels({ 
      userId: user.id,
      limit: Number(limit)
    });
    
    // Log access
    await storage.createLog({
      level: 'INFO',
      service: 'mobile-api',
      message: `User ${user.username} retrieved parcels list`
    });
    
    res.json({
      success: true,
      data: parcels,
      meta: {
        total: parcels.length,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error: any) {
    console.error('Get parcels error:', error);
    
    // Log error
    await storage.createLog({
      level: 'ERROR',
      service: 'mobile-api',
      message: `Get parcels error: ${error.message}`
    });
    
    res.status(500).json({ 
      success: false,
      message: `Server error: ${error.message}` 
    });
  }
});

// Get specific parcel endpoint
router.get('/parcels/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user as any;
    
    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: 'Parcel ID is required' 
      });
    }
    
    // Get the parcel
    const parcel = await storage.getParcel(id);
    
    if (!parcel) {
      return res.status(404).json({ 
        success: false,
        message: `Parcel with ID ${id} not found` 
      });
    }
    
    // Log access
    await storage.createLog({
      level: 'INFO',
      service: 'mobile-api',
      message: `User ${user.username} retrieved parcel ${id}`
    });
    
    res.json({
      success: true,
      data: parcel
    });
  } catch (error: any) {
    console.error('Get parcel error:', error);
    
    // Log error
    await storage.createLog({
      level: 'ERROR',
      service: 'mobile-api',
      message: `Get parcel error: ${error.message}`
    });
    
    res.status(500).json({ 
      success: false,
      message: `Server error: ${error.message}` 
    });
  }
});

// Get parcel notes with CRDT data
router.get('/parcels/:parcelId/notes', verifyToken, async (req, res) => {
  try {
    const { parcelId } = req.params;
    const user = req.user as any;
    
    if (!parcelId) {
      return res.status(400).json({ 
        success: false,
        message: 'Parcel ID is required' 
      });
    }
    
    // Get the parcel note
    const note = await storage.getParcelNoteByParcelId(parcelId);
    
    if (!note) {
      // Return empty note structure for new notes
      return res.json({
        success: true,
        data: {
          parcelId,
          content: '',
          yDocData: '',
          syncCount: 0,
          updatedAt: new Date().toISOString()
        }
      });
    }
    
    // Log access
    await storage.createLog({
      level: 'INFO',
      service: 'mobile-api',
      message: `User ${user.username} retrieved notes for parcel ${parcelId}`
    });
    
    res.json({
      success: true,
      data: note
    });
  } catch (error: any) {
    console.error('Get parcel notes error:', error);
    
    // Log error
    await storage.createLog({
      level: 'ERROR',
      service: 'mobile-api',
      message: `Get parcel notes error: ${error.message}`
    });
    
    res.status(500).json({ 
      success: false,
      message: `Server error: ${error.message}` 
    });
  }
});

// Update parcel notes with content and CRDT data
router.put('/parcels/:parcelId/notes', verifyToken, async (req, res) => {
  try {
    const { parcelId } = req.params;
    const { content, yDocData } = req.body;
    const user = req.user as any;
    
    if (!parcelId) {
      return res.status(400).json({ 
        success: false,
        message: 'Parcel ID is required' 
      });
    }
    
    if (!content && !yDocData) {
      return res.status(400).json({ 
        success: false,
        message: 'Note content or CRDT data is required' 
      });
    }
    
    // Get the parcel to verify it exists
    const parcel = await storage.getParcel(parcelId);
    
    if (!parcel) {
      return res.status(404).json({ 
        success: false,
        message: `Parcel with ID ${parcelId} not found` 
      });
    }
    
    // Check if note already exists
    const existingNote = await storage.getParcelNoteByParcelId(parcelId);
    
    let note;
    if (existingNote) {
      // Update existing note
      note = await storage.updateParcelNote(existingNote.id, {
        content: content || existingNote.content,
        yDocData: yDocData || existingNote.yDocData,
        userId: user.id,
        updatedAt: new Date(),
        syncCount: existingNote.syncCount + 1
      });
    } else {
      // Create new note
      note = await storage.createParcelNote({
        parcelId,
        content: content || '',
        yDocData: yDocData || '',
        userId: user.id,
        syncCount: 1
      });
    }
    
    // Log update
    await storage.createLog({
      level: 'INFO',
      service: 'mobile-api',
      message: `User ${user.username} updated notes for parcel ${parcelId}`
    });
    
    res.json({
      success: true,
      data: note
    });
  } catch (error: any) {
    console.error('Update parcel notes error:', error);
    
    // Log error
    await storage.createLog({
      level: 'ERROR',
      service: 'mobile-api',
      message: `Update parcel notes error: ${error.message}`
    });
    
    res.status(500).json({ 
      success: false,
      message: `Server error: ${error.message}` 
    });
  }
});

// Enhanced sync endpoint with CRDT merging
router.post('/sync', verifyToken, async (req, res) => {
  try {
    const { parcelId, update, timestamp } = req.body;
    const user = req.user as any;
    
    if (!parcelId || !update) {
      return res.status(400).json({ 
        success: false,
        message: 'Parcel ID and CRDT update are required' 
      });
    }
    
    // Use the mobileSyncService to properly merge CRDT updates
    const syncResult = await mobileSyncService.syncParcelNote(
      parcelId,
      update,
      user.id
    );
    
    // Log sync activity
    await storage.createLog({
      level: 'INFO',
      service: 'mobile-sync',
      message: `User ${user.username} synced parcel ${parcelId}`
    });
    
    res.json({
      success: true,
      syncedAt: new Date().toISOString(),
      ...syncResult
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    
    // Log error
    await storage.createLog({
      level: 'ERROR',
      service: 'mobile-sync',
      message: `Sync error: ${error.message}`
    });
    
    res.status(500).json({ 
      success: false,
      message: `Sync error: ${error.message}` 
    });
  }
});

// Batch sync endpoint for multiple updates
router.post('/batch-sync', verifyToken, async (req, res) => {
  try {
    const { updates } = req.body;
    const user = req.user as any;
    
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Valid updates array is required' 
      });
    }
    
    const results = [];
    
    // Process each update
    for (const item of updates) {
      const { parcelId, update } = item;
      
      if (!parcelId || !update) {
        results.push({
          parcelId,
          success: false,
          error: 'Parcel ID and update are required'
        });
        continue;
      }
      
      try {
        // Use the mobileSyncService to properly merge CRDT updates
        const syncResult = await mobileSyncService.syncParcelNote(
          parcelId,
          update,
          user.id
        );
        
        results.push({
          parcelId,
          success: true,
          syncedAt: new Date().toISOString(),
          ...syncResult
        });
      } catch (error: any) {
        results.push({
          parcelId,
          success: false,
          error: error.message
        });
      }
    }
    
    // Log batch sync activity
    await storage.createLog({
      level: 'INFO',
      service: 'mobile-sync',
      message: `User ${user.username} performed batch sync with ${updates.length} updates`
    });
    
    res.json({
      success: true,
      syncedAt: new Date().toISOString(),
      results
    });
  } catch (error: any) {
    console.error('Batch sync error:', error);
    
    // Log error
    await storage.createLog({
      level: 'ERROR',
      service: 'mobile-sync',
      message: `Batch sync error: ${error.message}`
    });
    
    res.status(500).json({ 
      success: false,
      message: `Batch sync error: ${error.message}` 
    });
  }
});

// Export router
export default router;