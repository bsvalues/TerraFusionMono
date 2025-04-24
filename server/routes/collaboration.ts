import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { collaborationService } from '../services/collaboration';
import { insertCollaborationSessionSchema } from '@shared/schema';

const router = Router();

// Schema for creating a new collaboration session
const createSessionSchema = z.object({
  documentType: z.string(),
  documentId: z.string(),
  name: z.string(),
  initialData: z.any().optional(),
});

// Schema for joining a session
const joinSessionSchema = z.object({
  sessionId: z.string(),
});

// Get all collaboration sessions (with optional filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { limit, ownerId, status, documentType, documentId } = req.query;
    
    const options: Record<string, any> = {};
    if (limit) options.limit = Number(limit);
    if (ownerId) options.ownerId = Number(ownerId);
    if (status) options.status = String(status);
    if (documentType) options.documentType = String(documentType);
    if (documentId) options.documentId = String(documentId);
    
    const sessions = await storage.getCollaborationSessions(options);
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching collaboration sessions:', error);
    res.status(500).json({ error: 'Failed to fetch collaboration sessions' });
  }
});

// Get a specific collaboration session
router.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const session = await storage.getCollaborationSessionBySessionId(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Collaboration session not found' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error fetching collaboration session:', error);
    res.status(500).json({ error: 'Failed to fetch collaboration session' });
  }
});

// Create a new collaboration session
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createSessionSchema.parse(req.body);
    
    // Ensure the user is authenticated
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await collaborationService.createCollaborationSession(
      req.user.id,
      validatedData.documentType,
      validatedData.documentId,
      validatedData.name,
      validatedData.initialData
    );
    
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    
    // Get the newly created session
    const session = await storage.getCollaborationSessionBySessionId(result.sessionId!);
    
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating collaboration session:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Failed to create collaboration session' });
  }
});

// Update a collaboration session
router.patch('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    // Ensure the user is authenticated
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get the session to check ownership
    const session = await storage.getCollaborationSessionBySessionId(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Collaboration session not found' });
    }
    
    // Only the owner can update the session (or an admin)
    if (session.ownerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this session' });
    }
    
    // Validate the updates
    const updatableFields = ['name', 'status', 'metadata', 'config'];
    const updates: Record<string, any> = {};
    
    for (const field of updatableFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    // Add updatedAt timestamp
    updates.updatedAt = new Date();
    
    // Update the session
    const updatedSession = await storage.updateCollaborationSession(session.id, updates);
    
    res.json(updatedSession);
  } catch (error) {
    console.error('Error updating collaboration session:', error);
    res.status(500).json({ error: 'Failed to update collaboration session' });
  }
});

// Get all participants for a session
router.get('/:sessionId/participants', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    // Check if the session exists
    const session = await storage.getCollaborationSessionBySessionId(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Collaboration session not found' });
    }
    
    const participants = await storage.getSessionParticipants(sessionId);
    
    res.json(participants);
  } catch (error) {
    console.error('Error fetching session participants:', error);
    res.status(500).json({ error: 'Failed to fetch session participants' });
  }
});

// Get all events for a session
router.get('/:sessionId/events', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { limit } = req.query;
    
    // Check if the session exists
    const session = await storage.getCollaborationSessionBySessionId(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Collaboration session not found' });
    }
    
    // Parse the since parameter if provided
    let since: Date | undefined;
    if (req.query.since) {
      since = new Date(String(req.query.since));
      if (isNaN(since.getTime())) {
        return res.status(400).json({ error: 'Invalid date format for "since" parameter' });
      }
    }
    
    const events = await storage.getCollaborationEvents({
      sessionId,
      limit: limit ? Number(limit) : undefined,
      since
    });
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching collaboration events:', error);
    res.status(500).json({ error: 'Failed to fetch collaboration events' });
  }
});

// Get document versions for a session or document
router.get('/versions', async (req: Request, res: Response) => {
  try {
    const { sessionId, documentType, documentId, limit } = req.query;
    
    if (!sessionId && (!documentType || !documentId)) {
      return res.status(400).json({
        error: 'Either sessionId or both documentType and documentId must be provided'
      });
    }
    
    const options: Record<string, any> = {};
    
    if (sessionId) options.sessionId = String(sessionId);
    if (documentType) options.documentType = String(documentType);
    if (documentId) options.documentId = String(documentId);
    if (limit) options.limit = Number(limit);
    
    const versions = await storage.getDocumentVersions(options);
    
    res.json(versions);
  } catch (error) {
    console.error('Error fetching document versions:', error);
    res.status(500).json({ error: 'Failed to fetch document versions' });
  }
});

// Get the latest document version
router.get('/versions/latest', async (req: Request, res: Response) => {
  try {
    const { documentType, documentId } = req.query;
    
    if (!documentType || !documentId) {
      return res.status(400).json({
        error: 'Both documentType and documentId must be provided'
      });
    }
    
    const version = await storage.getLatestDocumentVersion(
      String(documentType),
      String(documentId)
    );
    
    if (!version) {
      return res.status(404).json({ error: 'No document versions found' });
    }
    
    res.json(version);
  } catch (error) {
    console.error('Error fetching latest document version:', error);
    res.status(500).json({ error: 'Failed to fetch latest document version' });
  }
});

export default router;