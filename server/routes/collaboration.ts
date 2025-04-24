import express, { Request, Response, Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { v4 as uuid } from 'uuid';
import { insertCollaborationSessionSchema, insertDocumentVersionSchema, insertSessionParticipantSchema } from '@shared/schema';
import { collaborationService } from '../services/collaboration';

// Define validation schemas for request payloads
const createSessionSchema = z.object({
  ownerId: z.number(),
  documentType: z.string(),
  documentId: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),
  permissions: z.enum(['public', 'private']).optional(),
  initialState: z.string().optional(),
});

const updateSessionSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'archived', 'completed']).optional(),
  permissions: z.enum(['public', 'private']).optional(),
});

const router = Router();

// GET /api/collaboration - List all collaboration sessions
router.get('/', async (req: Request, res: Response) => {
  try {
    const options: {
      limit?: number;
      ownerId?: number;
      status?: string;
      documentType?: string;
      documentId?: string;
    } = {};
    
    if (req.query.limit && typeof req.query.limit === 'string') {
      options.limit = parseInt(req.query.limit, 10);
    }
    
    if (req.query.ownerId && typeof req.query.ownerId === 'string') {
      options.ownerId = parseInt(req.query.ownerId, 10);
    }
    
    if (req.query.status && typeof req.query.status === 'string') {
      options.status = req.query.status;
    }
    
    if (req.query.documentType && typeof req.query.documentType === 'string') {
      options.documentType = req.query.documentType;
    }
    
    if (req.query.documentId && typeof req.query.documentId === 'string') {
      options.documentId = req.query.documentId;
    }
    
    const sessions = await storage.getCollaborationSessions(options);
    res.json({ sessions });
  } catch (error) {
    console.error('Error getting collaboration sessions:', error);
    res.status(500).json({ error: 'Failed to get collaboration sessions' });
  }
});

// GET /api/collaboration/:sessionId - Get a single collaboration session
router.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const session = await storage.getCollaborationSessionBySessionId(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Collaboration session not found' });
    }
    
    res.json({ session });
  } catch (error) {
    console.error('Error getting collaboration session:', error);
    res.status(500).json({ error: 'Failed to get collaboration session' });
  }
});

// POST /api/collaboration - Create a new collaboration session
router.post('/', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = createSessionSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request body',
        issues: validationResult.error.issues 
      });
    }
    
    const { ownerId, documentType, documentId, name, description, permissions, initialState } = validationResult.data;
    
    // Create a new collaboration session
    const result = await collaborationService.createCollaborationSession({
      ownerId,
      documentType,
      documentId,
      name: name || `${documentType} ${documentId}`,
      description: description || '',
      permissions: permissions || 'private',
      initialState: initialState || null,
    });
    
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    
    res.status(201).json({ session: result.session });
  } catch (error) {
    console.error('Error creating collaboration session:', error);
    res.status(500).json({ error: 'Failed to create collaboration session' });
  }
});

// PATCH /api/collaboration/:sessionId - Update a collaboration session
router.patch('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    // Validate request body
    const validationResult = updateSessionSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request body',
        issues: validationResult.error.issues 
      });
    }
    
    // Get the session to update
    const session = await storage.getCollaborationSessionBySessionId(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Collaboration session not found' });
    }
    
    // Update the session
    const updatedSession = await storage.updateCollaborationSession(
      session.id,
      validationResult.data
    );
    
    res.json({ session: updatedSession });
  } catch (error) {
    console.error('Error updating collaboration session:', error);
    res.status(500).json({ error: 'Failed to update collaboration session' });
  }
});

// GET /api/collaboration/:sessionId/participants - Get participants for a session
router.get('/:sessionId/participants', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    // Check if the session exists
    const session = await storage.getCollaborationSessionBySessionId(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Collaboration session not found' });
    }
    
    // Get participants
    const participants = await storage.getSessionParticipants(sessionId);
    
    res.json({ participants });
  } catch (error) {
    console.error('Error getting session participants:', error);
    res.status(500).json({ error: 'Failed to get session participants' });
  }
});

// GET /api/collaboration/:sessionId/events - Get events for a session
router.get('/:sessionId/events', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    // Validate the session exists
    const session = await storage.getCollaborationSessionBySessionId(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Collaboration session not found' });
    }
    
    // Get optional parameters
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const since = req.query.since ? new Date(req.query.since as string) : undefined;
    
    // Get events
    const events = await storage.getCollaborationEvents({
      sessionId,
      limit,
      since
    });
    
    res.json({ events });
  } catch (error) {
    console.error('Error getting collaboration events:', error);
    res.status(500).json({ error: 'Failed to get collaboration events' });
  }
});

// GET /api/collaboration/versions - Get versions for a document
router.get('/versions', async (req: Request, res: Response) => {
  try {
    // Validate parameters
    if (!req.query.documentType || !req.query.documentId) {
      return res.status(400).json({ error: 'documentType and documentId are required' });
    }
    
    const documentType = req.query.documentType as string;
    const documentId = req.query.documentId as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    
    // Get versions
    const versions = await storage.getDocumentVersions({
      documentType,
      documentId,
      limit
    });
    
    res.json({ versions });
  } catch (error) {
    console.error('Error getting document versions:', error);
    res.status(500).json({ error: 'Failed to get document versions' });
  }
});

// GET /api/collaboration/versions/latest - Get the latest version for a document
router.get('/versions/latest', async (req: Request, res: Response) => {
  try {
    // Validate parameters
    if (!req.query.documentType || !req.query.documentId) {
      return res.status(400).json({ error: 'documentType and documentId are required' });
    }
    
    const documentType = req.query.documentType as string;
    const documentId = req.query.documentId as string;
    
    // Get the latest version
    const version = await storage.getLatestDocumentVersion(documentType, documentId);
    
    if (!version) {
      return res.status(404).json({ error: 'No versions found for this document' });
    }
    
    res.json({ version });
  } catch (error) {
    console.error('Error getting latest document version:', error);
    res.status(500).json({ error: 'Failed to get latest document version' });
  }
});

export default router;