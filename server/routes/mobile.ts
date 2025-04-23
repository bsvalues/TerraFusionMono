import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { storage } from '../storage';
import { z } from 'zod';

// Add type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      isAuthenticated(): boolean;
      user?: any;
    }
  }
}

const router = Router();

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'terrafield-dev-secret';

// Middleware to verify JWT token
const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; username: string };
    
    // Set user on request object
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Add user to request object
    req.user = user;
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Create development bypass middleware
const developmentAuthBypass = (req: Request, res: Response, next: NextFunction) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment && req.path.includes('/sync/crdt')) {
    // Skip authentication in development mode for CRDT routes only
    console.log('Development mode: Bypassing authentication for CRDT endpoint');
    req.user = { id: 1 }; // Mock user for development
    next();
  } else {
    // Use normal authentication
    authenticateJWT(req, res, next);
  }
};

// Apply authentication middleware to all routes in this router
router.use(developmentAuthBypass);

/**
 * @route GET /api/mobile/user
 * @desc Get current user information
 * @access Private
 */
router.get('/user', async (req: Request, res: Response) => {
  try {
    // User is already set by the authenticateJWT middleware
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/mobile/parcels
 * @desc Get all parcels for the user
 * @access Private
 */
router.get('/parcels', async (req: Request, res: Response) => {
  try {
    // Get parcels
    const parcels = await storage.getParcels({ userId: req.user.id });
    
    // For each parcel, check if it has notes
    const parcelsWithNoteInfo = await Promise.all(
      parcels.map(async (parcel) => {
        const note = await storage.getParcelNoteByParcelId(parcel.id);
        return {
          ...parcel,
          hasNotes: !!note
        };
      })
    );
    
    res.json(parcelsWithNoteInfo);
  } catch (error) {
    console.error('Get parcels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/mobile/parcels/:id
 * @desc Get a specific parcel
 * @access Private
 */
router.get('/parcels/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get parcel
    const parcel = await storage.getParcel(id);
    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }
    
    // Check if parcel has notes
    const note = await storage.getParcelNoteByParcelId(id);
    
    res.json({
      ...parcel,
      hasNotes: !!note
    });
  } catch (error) {
    console.error('Get parcel error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/mobile/parcels/:id/notes
 * @desc Get notes for a specific parcel
 * @access Private
 */
router.get('/parcels/:id/notes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if parcel exists
    const parcel = await storage.getParcel(id);
    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }
    
    // Get note
    const note = await storage.getParcelNoteByParcelId(id);
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    res.json(note);
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/mobile/parcels/:id/notes
 * @desc Create a note for a parcel
 * @access Private
 */
router.post('/parcels/:id/notes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Note text is required' });
    }
    
    // Check if parcel exists
    const parcel = await storage.getParcel(id);
    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }
    
    // Check if note already exists
    const existingNote = await storage.getParcelNoteByParcelId(id);
    if (existingNote) {
      return res.status(400).json({ message: 'Note already exists for this parcel' });
    }
    
    // Create note
    const note = await storage.createParcelNote({
      parcelId: id,
      text,
      userId: req.user.id,
    });
    
    res.status(201).json(note);
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route PATCH /api/mobile/parcels/:id/notes/:noteId
 * @desc Update a note
 * @access Private
 */
router.patch('/parcels/:id/notes/:noteId', async (req: Request, res: Response) => {
  try {
    const { id, noteId } = req.params;
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Note text is required' });
    }
    
    // Check if parcel exists
    const parcel = await storage.getParcel(id);
    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }
    
    // Get note
    const note = await storage.getParcelNote(parseInt(noteId));
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Check if note belongs to parcel
    if (note.parcelId !== id) {
      return res.status(400).json({ message: 'Note does not belong to this parcel' });
    }
    
    // Update note
    const updatedNote = await storage.updateParcelNote(parseInt(noteId), { text });
    if (!updatedNote) {
      return res.status(404).json({ message: 'Failed to update note' });
    }
    
    res.json(updatedNote);
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route DELETE /api/mobile/parcels/:id/notes/:noteId
 * @desc Delete a note
 * @access Private
 */
router.delete('/parcels/:id/notes/:noteId', async (req: Request, res: Response) => {
  try {
    const { id, noteId } = req.params;
    
    // Check if parcel exists
    const parcel = await storage.getParcel(id);
    if (!parcel) {
      return res.status(404).json({ message: 'Parcel not found' });
    }
    
    // Get note
    const note = await storage.getParcelNote(parseInt(noteId));
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }
    
    // Check if note belongs to parcel
    if (note.parcelId !== id) {
      return res.status(400).json({ message: 'Note does not belong to this parcel' });
    }
    
    // Delete note (soft delete)
    const updatedNote = await storage.updateParcelNote(parseInt(noteId), { isDeleted: true });
    if (!updatedNote) {
      return res.status(404).json({ message: 'Failed to delete note' });
    }
    
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/mobile/sync
 * @desc Sync data between mobile and server
 * @access Private
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const { lastSyncTime, changes } = req.body;
    
    if (!changes || !Array.isArray(changes)) {
      return res.status(400).json({ message: 'Changes are required and must be an array' });
    }
    
    // Process changes
    const results = [];
    
    for (const change of changes) {
      const { type, entity, data, id } = change;
      
      if (!type || !entity || !data) {
        results.push({
          success: false,
          id: id || 'unknown',
          error: 'Invalid change format'
        });
        continue;
      }
      
      try {
        // Handle different entity types
        if (entity === 'parcel') {
          if (type === 'update' && id) {
            const updatedParcel = await storage.updateParcel(id, data);
            results.push({
              success: !!updatedParcel,
              id,
              data: updatedParcel || undefined
            });
          } else {
            results.push({
              success: false,
              id: id || 'unknown',
              error: 'Unsupported operation for parcel'
            });
          }
        } else if (entity === 'parcelNote') {
          if (type === 'create') {
            const newNote = await storage.createParcelNote({
              ...data,
              userId: req.user.id
            });
            results.push({
              success: true,
              id: data.id || newNote.id.toString(),
              data: newNote
            });
          } else if (type === 'update' && id) {
            const note = await storage.getParcelNote(parseInt(id));
            
            if (!note) {
              results.push({
                success: false,
                id,
                error: 'Note not found'
              });
              continue;
            }
            
            const updatedNote = await storage.updateParcelNote(parseInt(id), data);
            results.push({
              success: !!updatedNote,
              id,
              data: updatedNote || undefined
            });
          } else if (type === 'delete' && id) {
            const note = await storage.getParcelNote(parseInt(id));
            
            if (!note) {
              results.push({
                success: false,
                id,
                error: 'Note not found'
              });
              continue;
            }
            
            const updatedNote = await storage.updateParcelNote(parseInt(id), { isDeleted: true });
            results.push({
              success: !!updatedNote,
              id,
              data: { id, isDeleted: true }
            });
          } else {
            results.push({
              success: false,
              id: id || 'unknown',
              error: 'Unsupported operation for parcelNote'
            });
          }
        } else {
          results.push({
            success: false,
            id: id || 'unknown',
            error: 'Unsupported entity type'
          });
        }
      } catch (error) {
        console.error(`Error processing change for ${entity} ${id}:`, error);
        results.push({
          success: false,
          id: id || 'unknown',
          error: 'Processing error'
        });
      }
    }
    
    // Get updates since lastSyncTime
    let updates = {};
    
    if (lastSyncTime) {
      const syncDate = new Date(lastSyncTime);
      
      // Get parcels updated since last sync
      const updatedParcels = await storage.getParcels({
        userId: req.user?.id,
        limit: 100
      });
      
      // Get parcel notes updated since last sync
      const updatedNotes = await storage.getParcelNotes({
        userId: req.user?.id,
        updatedSince: syncDate,
        limit: 100
      });
      
      updates = {
        parcels: updatedParcels,
        parcelNotes: updatedNotes
      };
    }
    
    res.json({
      success: true,
      results,
      updates,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/mobile/sync/crdt
 * @desc Synchronize data between mobile and server using CRDT (conflict-free replicated data type)
 * @access Private
 */
router.post('/sync/crdt', async (req: Request, res: Response) => {
  // For development testing: bypass authentication
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    // Skip authentication in development mode
    req.user = { id: 1 }; // Mock user for development
  } else if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const { parcelId, update } = req.body;
    
    if (!parcelId) {
      return res.status(400).json({ message: 'Parcel ID is required' });
    }
    
    if (!update) {
      return res.status(400).json({ message: 'Yjs update is required' });
    }
    
    // Validate base64 format
    try {
      Buffer.from(update, 'base64');
    } catch (e) {
      return res.status(400).json({ 
        message: 'Invalid base64 encoding for Yjs update',
        error: e instanceof Error ? e.message : String(e)
      });
    }
    
    try {
      const { mobileSyncService } = await import('../services/mobile-sync');
      
      // Apply the CRDT update and get the merged state
      const result = await mobileSyncService.syncParcelNote(
        parcelId,
        update,
        req.user?.id || 0 // Fallback to 0 if user ID is not available
      );
      
      res.json({
        success: true,
        update: result.update,
        timestamp: result.timestamp
      });
    } catch (syncError) {
      console.error('CRDT update processing error:', syncError);
      res.status(400).json({ 
        message: 'Error processing CRDT update',
        error: syncError instanceof Error ? syncError.message : String(syncError)
      });
    }
  } catch (error) {
    console.error('CRDT sync error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * @route GET /api/mobile/sync/crdt/:parcelId
 * @desc Get the latest CRDT state for a parcel note
 * @access Private
 */
router.get('/sync/crdt/:parcelId', async (req: Request, res: Response) => {
  // For development testing: bypass authentication
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    // Skip authentication in development mode
    req.user = { id: 1 }; // Mock user for development
  } else if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const { parcelId } = req.params;
    
    if (!parcelId) {
      return res.status(400).json({ message: 'Parcel ID is required' });
    }
    
    const { mobileSyncService } = await import('../services/mobile-sync');
    
    // Get the latest state
    const note = await mobileSyncService.getParcelNote(parcelId);
    
    if (!note || !note.yDocData) {
      return res.status(404).json({ message: 'No CRDT data found for this parcel' });
    }
    
    res.json({
      success: true,
      update: note.yDocData,
      timestamp: note.updatedAt
    });
  } catch (error) {
    console.error('CRDT get error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/mobile/sync/crdt/test
 * @desc Testing endpoint to create a new Yjs document with sample data
 * @access Private
 */
router.post('/sync/crdt/test', async (req: Request, res: Response) => {
  // For development testing only
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (!isDevelopment) {
    return res.status(403).json({ message: 'This endpoint is only available in development mode' });
  }
  
  try {
    // Get request parameters
    const parcelId = req.body.parcelId || `test-parcel-${Date.now()}`;
    const text = req.body.text || `Test note created at ${new Date().toISOString()}`;
    const operation = req.body.operation || 'create'; // 'create' or 'update'
    
    // Create a new Y.Doc with sample text
    const Y = await import('yjs');
    const doc = new Y.Doc();
    const yText = doc.getText('notes');
    
    // If we're updating an existing document, first get it from the database
    if (operation === 'update') {
      try {
        // Get existing document
        const { mobileSyncService } = await import('../services/mobile-sync');
        const existingNote = await mobileSyncService.getParcelNote(parcelId);
        
        // If it exists and has CRDT data, apply that first
        if (existingNote && existingNote.yDocData) {
          // Apply existing state
          const existingUpdate = Buffer.from(existingNote.yDocData, 'base64');
          Y.applyUpdate(doc, existingUpdate);
          
          console.log('Loaded existing document for update, current text:', yText.toString());
        }
      } catch (e) {
        console.log('No existing document found, creating new one');
      }
    }
    
    // Add new text at end of document
    yText.insert(yText.length, '\n' + text);
    
    // Encode the document state
    const updateBuffer = Y.encodeStateAsUpdate(doc);
    const base64Update = Buffer.from(updateBuffer).toString('base64');
    
    // Save to database using the same service as the main endpoint
    const { mobileSyncService } = await import('../services/mobile-sync');
    const result = await mobileSyncService.syncParcelNote(
      parcelId,
      base64Update,
      1 // Use user ID 1 for testing
    );
    
    res.json({
      success: true,
      parcelId,
      operation,
      text: yText.toString(),
      update: result.update,
      timestamp: result.timestamp
    });
  } catch (error) {
    console.error('Test CRDT creation/update error:', error);
    res.status(500).json({ 
      message: 'Error processing CRDT document',
      error: error.message
    });
  }
});

export default router;