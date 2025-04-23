import express from 'express';
import { storage } from '../storage';
import { verifyToken } from './auth';

const router = express.Router();

// Ping endpoint - used to check connectivity from mobile app
router.get('/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'TerraFusion API is running', 
    timestamp: new Date().toISOString() 
  });
});

// Auth validation endpoint
router.get('/auth/validate', verifyToken, (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user as any;
  res.json({ valid: true, user: userWithoutPassword });
});

// Get parcels endpoint - with optional filtering
router.get('/parcels', verifyToken, async (req, res) => {
  try {
    const user = req.user as any;
    
    // Get parcels associated with the user
    const parcels = await storage.getParcels({ userId: user.id });
    
    res.json(parcels);
  } catch (error: any) {
    console.error('Get parcels error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Get specific parcel endpoint
router.get('/parcels/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'Parcel ID is required' });
    }
    
    // Get the parcel
    const parcel = await storage.getParcel(id);
    
    if (!parcel) {
      return res.status(404).json({ message: `Parcel with ID ${id} not found` });
    }
    
    res.json(parcel);
  } catch (error: any) {
    console.error('Get parcel error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Get parcel notes endpoint
router.get('/parcels/:parcelId/notes', verifyToken, async (req, res) => {
  try {
    const { parcelId } = req.params;
    
    if (!parcelId) {
      return res.status(400).json({ message: 'Parcel ID is required' });
    }
    
    // Get the parcel note
    const note = await storage.getParcelNoteByParcelId(parcelId);
    
    if (!note) {
      return res.status(404).json({ message: `Note for parcel with ID ${parcelId} not found` });
    }
    
    res.json(note);
  } catch (error: any) {
    console.error('Get parcel notes error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Save parcel notes endpoint
router.post('/parcels/:parcelId/notes', verifyToken, async (req, res) => {
  try {
    const { parcelId } = req.params;
    const { content } = req.body;
    
    if (!parcelId) {
      return res.status(400).json({ message: 'Parcel ID is required' });
    }
    
    if (!content) {
      return res.status(400).json({ message: 'Note content is required' });
    }
    
    // Get the parcel to verify it exists
    const parcel = await storage.getParcel(parcelId);
    
    if (!parcel) {
      return res.status(404).json({ message: `Parcel with ID ${parcelId} not found` });
    }
    
    // Check if note already exists
    const existingNote = await storage.getParcelNoteByParcelId(parcelId);
    
    let note;
    if (existingNote) {
      // Update existing note
      note = await storage.updateParcelNote(existingNote.id, {
        content,
        updatedAt: new Date()
      });
    } else {
      // Create new note
      note = await storage.createParcelNote({
        parcelId,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncCount: 0
      });
    }
    
    res.json(note);
  } catch (error: any) {
    console.error('Save parcel notes error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Get parcel updates endpoint
router.get('/parcels/:parcelId/updates', verifyToken, async (req, res) => {
  try {
    const { parcelId } = req.params;
    
    if (!parcelId) {
      return res.status(400).json({ message: 'Parcel ID is required' });
    }
    
    // Get parcel note with CRDT data
    const note = await storage.getParcelNoteByParcelId(parcelId);
    
    if (!note) {
      return res.status(404).json({ message: `Note for parcel with ID ${parcelId} not found` });
    }
    
    // Return CRDT update data
    res.json({
      update: note.yDocData || '',
      timestamp: note.updatedAt.toISOString(),
      syncCount: note.syncCount
    });
  } catch (error: any) {
    console.error('Get parcel updates error:', error);
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
});

// Sync endpoint - receive CRDT updates from mobile client
router.post('/sync', verifyToken, async (req, res) => {
  try {
    const { parcelId, update, timestamp } = req.body;
    
    if (!parcelId || !update) {
      return res.status(400).json({ message: 'Parcel ID and update are required' });
    }
    
    const user = req.user as any;
    const updateTime = timestamp ? new Date(timestamp) : new Date();
    
    // Get the parcel note
    let note = await storage.getParcelNoteByParcelId(parcelId);
    
    if (!note) {
      // Create new note with CRDT data
      note = await storage.createParcelNote({
        parcelId,
        content: '',
        yDocData: update,
        createdAt: updateTime,
        updatedAt: updateTime,
        syncCount: 1
      });
    } else {
      // Update existing note with new CRDT data
      // In a real implementation, you would merge the CRDT updates here
      note = await storage.updateParcelNote(note.id, {
        yDocData: update,
        updatedAt: updateTime,
        syncCount: (note.syncCount || 0) + 1
      });
    }
    
    // Log sync activity
    await storage.createLog({
      level: 'INFO',
      service: 'mobile-sync',
      message: `User ${user.username} synced parcel ${parcelId}`
    });
    
    res.json({
      status: 'success',
      syncedAt: new Date().toISOString(),
      syncCount: note.syncCount
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    
    // Log error
    await storage.createLog({
      level: 'ERROR',
      service: 'mobile-sync',
      message: `Sync error: ${error.message}`
    });
    
    res.status(500).json({ message: `Sync error: ${error.message}` });
  }
});

// Export router
export default router;