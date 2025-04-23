import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { isAuthenticated } from '../middleware/auth';
import * as Y from 'yjs';
import { z } from 'zod';

const router = Router();

// Type for mobile sync data
const SyncDataSchema = z.object({
  parcelId: z.string(),
  update: z.string(), // Base64 encoded CRDT update
  timestamp: z.string().or(z.date()).transform((val) => new Date(val)),
});

/**
 * @route GET /api/mobile/parcels
 * @desc Get parcels available to the user
 * @access Private
 */
router.get('/parcels', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // In a real implementation, we would filter parcels by user access
    // and include pagination
    const parcels = await storage.getParcels({
      limit: 100,
      userId: req.user?.id,
    });
    
    // Format response for mobile app
    const formattedParcels = parcels.map(parcel => ({
      id: parcel.id,
      name: parcel.name,
      address: parcel.address,
      city: parcel.city,
      state: parcel.state,
      zipCode: parcel.zipCode,
      syncStatus: 'synced', // Default status for now
    }));
    
    res.json(formattedParcels);
  } catch (error: any) {
    console.error('Error fetching parcels for mobile:', error);
    res.status(500).json({ message: 'Failed to retrieve parcels', error: error.message });
  }
});

/**
 * @route GET /api/mobile/parcels/:id
 * @desc Get single parcel detail by ID
 * @access Private
 */
router.get('/parcels/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const parcelId = req.params.id;
    
    // Get parcel from database
    const parcel = await storage.getParcel(parcelId);
    
    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }
    
    // Check if user has access to this parcel
    // In a real implementation, we would verify user permissions
    
    res.json(parcel);
  } catch (error: any) {
    console.error(`Error fetching parcel ${req.params.id} for mobile:`, error);
    res.status(500).json({ message: 'Failed to retrieve parcel', error: error.message });
  }
});

/**
 * @route GET /api/mobile/parcels/:id/notes
 * @desc Get notes for a specific parcel
 * @access Private
 */
router.get('/parcels/:id/notes', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const parcelId = req.params.id;
    
    // Get parcel notes from database
    const notes = await storage.getParcelNoteByParcelId(parcelId);
    
    if (!notes) {
      // No notes yet, return empty content
      return res.json({
        id: `note-${parcelId}`,
        parcelId,
        content: '',
        lastEdited: new Date(),
        syncStatus: 'synced',
      });
    }
    
    res.json(notes);
  } catch (error: any) {
    console.error(`Error fetching notes for parcel ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to retrieve parcel notes', error: error.message });
  }
});

/**
 * @route POST /api/mobile/parcels/:id/notes
 * @desc Save notes for a specific parcel
 * @access Private
 */
router.post('/parcels/:id/notes', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const parcelId = req.params.id;
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }
    
    // Check if note already exists
    const existingNote = await storage.getParcelNoteByParcelId(parcelId);
    
    if (existingNote) {
      // Update existing note
      const updatedNote = await storage.updateParcelNote(existingNote.id, {
        content,
        lastEdited: new Date(),
        updatedAt: new Date(),
      });
      
      return res.json(updatedNote);
    } else {
      // Create new note
      const newNote = await storage.createParcelNote({
        parcelId,
        content,
        lastEdited: new Date(),
        createdBy: req.user?.username || 'unknown',
        syncStatus: 'synced',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      return res.json(newNote);
    }
  } catch (error: any) {
    console.error(`Error saving notes for parcel ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to save parcel notes', error: error.message });
  }
});

/**
 * @route GET /api/mobile/parcels/:id/updates
 * @desc Get CRDT updates for a parcel
 * @access Private
 */
router.get('/parcels/:id/updates', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const parcelId = req.params.id;
    
    // Get parcel notes from database
    const notes = await storage.getParcelNoteByParcelId(parcelId);
    
    if (!notes || !notes.content) {
      // No updates yet
      return res.json({ update: null });
    }
    
    // In a real implementation, we would store the CRDT updates separately
    // For now, we'll just return the content as a simple update
    const doc = new Y.Doc();
    const text = doc.getText('notes');
    text.insert(0, notes.content);
    
    // Encode the state as an update
    const update = Y.encodeStateAsUpdate(doc);
    const base64Update = Buffer.from(update).toString('base64');
    
    res.json({ 
      update: base64Update,
      timestamp: notes.updatedAt
    });
  } catch (error: any) {
    console.error(`Error fetching updates for parcel ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to retrieve parcel updates', error: error.message });
  }
});

/**
 * @route POST /api/mobile/sync
 * @desc Sync data from mobile client
 * @access Private
 */
router.post('/sync', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Validate sync data
    const result = SyncDataSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: 'Invalid sync data', 
        errors: result.error.format() 
      });
    }
    
    const { parcelId, update, timestamp } = result.data;
    
    // Get existing note if any
    const existingNote = await storage.getParcelNoteByParcelId(parcelId);
    
    // Create a Y.Doc to apply the update
    const doc = new Y.Doc();
    
    // Apply the update
    const updateBuffer = Buffer.from(update, 'base64');
    Y.applyUpdate(doc, updateBuffer);
    
    // Get the text content
    const text = doc.getText('notes');
    const content = text.toString();
    
    if (existingNote) {
      // Create a new doc with existing content
      const existingDoc = new Y.Doc();
      const existingText = existingDoc.getText('notes');
      existingText.insert(0, existingNote.content);
      
      // Apply the update to the existing doc as well
      Y.applyUpdate(existingDoc, updateBuffer);
      
      // Get the merged content
      const mergedText = existingDoc.getText('notes');
      const mergedContent = mergedText.toString();
      
      // Update the note with merged content
      const updatedNote = await storage.updateParcelNote(existingNote.id, {
        content: mergedContent,
        lastEdited: timestamp,
        updatedAt: new Date()
      });
      
      // Return success
      return res.json({
        success: true,
        note: updatedNote
      });
    } else {
      // Create a new note
      const newNote = await storage.createParcelNote({
        parcelId,
        content,
        lastEdited: timestamp,
        createdBy: req.user?.username || 'unknown',
        syncStatus: 'synced',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Return success
      return res.json({
        success: true,
        note: newNote
      });
    }
  } catch (error: any) {
    console.error('Error syncing data from mobile:', error);
    res.status(500).json({ message: 'Sync failed', error: error.message });
  }
});

/**
 * @route GET /api/mobile/ping
 * @desc Simple endpoint for connectivity check
 * @access Public
 */
router.get('/ping', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

/**
 * @route POST /api/mobile/auth/validate
 * @desc Validate authentication token
 * @access Private
 */
router.get('/auth/validate', isAuthenticated, (req: Request, res: Response) => {
  res.status(200).json({ 
    valid: true, 
    user: {
      id: req.user?.id,
      username: req.user?.username,
      email: req.user?.email,
    }
  });
});

export default router;