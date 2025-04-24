import * as Y from 'yjs';
import { WebSocket } from 'ws';
import { storage } from '../storage';
import { v4 as uuid } from 'uuid';
import { 
  InsertCollaborationEvent, 
  InsertCollaborationSession, 
  InsertDocumentVersion, 
  InsertSessionParticipant,
  CollaborationSession,
  DocumentVersion
} from '@shared/schema';

interface YDocMap {
  [key: string]: {
    ydoc: Y.Doc;
    clients: Map<string, WebSocketClient>;
    lastUpdate: Date;
  }
}

interface WebSocketClient {
  userId: number;
  username: string;
  sessionId: string;
  clientId: string;
  ws: WebSocket;
  color: string;
  position?: { x: number, y: number };
  selection?: { anchor: number, head: number };
  lastActivity: Date;
}

// Store Y.js documents and active client connections in memory
const sessions: YDocMap = {};

// Create a map of cursor colors for different clients
const cursorColors = [
  '#FF5733', // Red
  '#33FF57', // Green
  '#3357FF', // Blue
  '#FF33F5', // Pink
  '#33FFF5', // Cyan
  '#F5FF33', // Yellow
  '#FF8333', // Orange
  '#8333FF', // Purple
  '#33FF83', // Mint
  '#FF3383', // Magenta
];

/**
 * Get a random color from the cursor colors palette
 */
function getRandomColor(): string {
  const index = Math.floor(Math.random() * cursorColors.length);
  return cursorColors[index];
}

/**
 * Encode a Y.js document to a base64 string for storage
 */
function encodeYDoc(ydoc: Y.Doc): string {
  const update = Y.encodeStateAsUpdate(ydoc);
  const updateArray = Array.from(update);
  return Buffer.from(updateArray).toString('base64');
}

/**
 * Decode a base64 string to a Y.js document
 */
function decodeYDoc(base64State: string): Y.Doc {
  const ydoc = new Y.Doc();
  
  if (base64State) {
    try {
      const buffer = Buffer.from(base64State, 'base64');
      const update = new Uint8Array(buffer);
      Y.applyUpdate(ydoc, update);
    } catch (error) {
      console.error('Error decoding Y.js document:', error);
    }
  }
  
  return ydoc;
}

/**
 * Process Y.js update from a client and apply it to the shared document
 */
export async function processYjsUpdate(
  clientId: string,
  sessionId: string,
  update: Uint8Array
): Promise<void> {
  // Get or initialize session
  const sessionData = sessions[sessionId];
  if (!sessionData) {
    console.error(`Session ${sessionId} not found`);
    return;
  }
  
  // Apply update to the shared document
  Y.applyUpdate(sessionData.ydoc, update);
  
  // Update last activity timestamp
  const client = sessionData.clients.get(clientId);
  if (client) {
    client.lastActivity = new Date();
  }
  
  // Update the lastUpdate timestamp
  sessionData.lastUpdate = new Date();
  
  // Broadcast update to other clients
  broadcastYjsUpdate(sessionId, update, clientId);
  
  // Log the event
  try {
    await storage.createCollaborationEvent({
      sessionId,
      userId: client?.userId || 0,
      username: client?.username || 'Unknown',
      eventType: 'update',
      eventData: JSON.stringify({
        clientId,
        updateSize: update.length
      }),
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error logging collaboration event:', error);
  }
}

/**
 * Broadcast Y.js update to all clients in a session except the sender
 */
function broadcastYjsUpdate(sessionId: string, update: Uint8Array, excludeClientId: string): void {
  const sessionData = sessions[sessionId];
  if (!sessionData) return;
  
  // Convert update to base64 for transmission
  const updateBase64 = Buffer.from(update).toString('base64');
  
  // Prepare the message
  const message = JSON.stringify({
    type: 'yjsUpdate',
    update: updateBase64,
    clientId: excludeClientId
  });
  
  // Send to all clients except the sender
  for (const [clientId, client] of sessionData.clients.entries()) {
    if (clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

/**
 * Update a client's cursor position and broadcast to other clients in the session
 */
export async function updateCursorPosition(
  clientId: string,
  sessionId: string,
  position: { x: number, y: number },
  selection?: { anchor: number, head: number }
): Promise<void> {
  const sessionData = sessions[sessionId];
  if (!sessionData) return;
  
  const client = sessionData.clients.get(clientId);
  if (!client) return;
  
  // Update client's cursor position
  client.position = position;
  client.selection = selection;
  client.lastActivity = new Date();
  
  // Broadcast to other clients
  const message = JSON.stringify({
    type: 'cursor',
    data: {
      clientId,
      position,
      selection
    }
  });
  
  for (const [otherId, otherClient] of sessionData.clients.entries()) {
    if (otherId !== clientId && otherClient.ws.readyState === WebSocket.OPEN) {
      otherClient.ws.send(message);
    }
  }
}

/**
 * Handle client presence update (active, inactive, away)
 */
export async function updatePresence(
  clientId: string,
  sessionId: string,
  state: 'active' | 'inactive' | 'away'
): Promise<void> {
  const sessionData = sessions[sessionId];
  if (!sessionData) return;
  
  const client = sessionData.clients.get(clientId);
  if (!client) return;
  
  // Update last activity timestamp
  client.lastActivity = new Date();
  
  // Broadcast to other clients
  const message = JSON.stringify({
    type: 'presence',
    clientId,
    state
  });
  
  for (const [otherId, otherClient] of sessionData.clients.entries()) {
    if (otherId !== clientId && otherClient.ws.readyState === WebSocket.OPEN) {
      otherClient.ws.send(message);
    }
  }
  
  // Log the event
  try {
    await storage.createCollaborationEvent({
      sessionId,
      userId: client.userId,
      username: client.username,
      eventType: 'presence',
      eventData: JSON.stringify({ state }),
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error logging presence event:', error);
  }
}

/**
 * Save the current state of a document as a version
 */
async function saveDocumentVersion(sessionId: string): Promise<DocumentVersion | undefined> {
  const sessionData = sessions[sessionId];
  if (!sessionData) return;
  
  try {
    // Get the session
    const session = await storage.getCollaborationSessionBySessionId(sessionId);
    if (!session) return;
    
    // Encode the document state
    const encodedState = encodeYDoc(sessionData.ydoc);
    
    // Get the latest version number
    const latestVersion = await storage.getLatestDocumentVersion(
      session.documentType,
      session.documentId
    );
    
    const versionNumber = latestVersion ? latestVersion.version + 1 : 1;
    
    // Create a new version
    const newVersion = await storage.createDocumentVersion({
      sessionId,
      documentType: session.documentType,
      documentId: session.documentId,
      version: versionNumber,
      state: encodedState,
      createdAt: new Date(),
      createdBy: session.ownerId,
      description: `Auto-saved version ${versionNumber}`
    });
    
    console.log(`Saved document version ${versionNumber} for session ${sessionId}`);
    
    return newVersion;
  } catch (error) {
    console.error('Error saving document version:', error);
    return undefined;
  }
}

/**
 * Initialize a collaboration session
 */
export async function initializeSession(
  sessionId: string,
  createIfNotExists: boolean = false
): Promise<{ success: boolean, message?: string, session?: CollaborationSession }> {
  try {
    // Check if session already exists in memory
    if (sessions[sessionId]) {
      return { success: true, session: await storage.getCollaborationSessionBySessionId(sessionId) };
    }
    
    // Check if session exists in database
    const session = await storage.getCollaborationSessionBySessionId(sessionId);
    
    if (!session) {
      if (!createIfNotExists) {
        return { success: false, message: 'Collaboration session not found' };
      }
      
      // Session doesn't exist but createIfNotExists is true
      return { success: false, message: 'Session must be created first via API' };
    }
    
    // Initialize Y.js document
    const ydoc = new Y.Doc();
    
    // Apply initial state if available
    if (session.initialState) {
      try {
        const buffer = Buffer.from(session.initialState, 'base64');
        const update = new Uint8Array(buffer);
        Y.applyUpdate(ydoc, update);
      } catch (error) {
        console.error('Error applying initial state:', error);
      }
    } else {
      // Try to load the latest version
      const latestVersion = await storage.getLatestDocumentVersion(
        session.documentType,
        session.documentId
      );
      
      if (latestVersion && latestVersion.state) {
        try {
          const buffer = Buffer.from(latestVersion.state, 'base64');
          const update = new Uint8Array(buffer);
          Y.applyUpdate(ydoc, update);
        } catch (error) {
          console.error('Error applying latest version:', error);
        }
      }
    }
    
    // Add session to the in-memory store
    sessions[sessionId] = {
      ydoc,
      clients: new Map(),
      lastUpdate: new Date()
    };
    
    return { success: true, session };
  } catch (error) {
    console.error('Error initializing session:', error);
    return { success: false, message: 'Failed to initialize session' };
  }
}

/**
 * Add a client to a collaboration session
 */
export async function addClientToSession(
  ws: WebSocket,
  sessionId: string,
  userId: number,
  username: string
): Promise<{ success: boolean, message?: string, clientId?: string }> {
  try {
    // Check if session exists
    const sessionData = sessions[sessionId];
    if (!sessionData) {
      return { success: false, message: 'Session not initialized' };
    }
    
    // Generate a new client ID
    const clientId = uuid();
    
    // Create client
    const client: WebSocketClient = {
      userId,
      username,
      sessionId,
      clientId,
      ws,
      color: getRandomColor(),
      lastActivity: new Date()
    };
    
    // Add client to the session
    sessionData.clients.set(clientId, client);
    
    // Get list of other clients in the session
    const otherClients = Array.from(sessionData.clients.entries())
      .filter(([id]) => id !== clientId)
      .map(([_, c]) => ({
        clientId: c.clientId,
        userId: c.userId,
        username: c.username,
        color: c.color,
        position: c.position,
        selection: c.selection
      }));
    
    // Send initial state to the client
    ws.send(JSON.stringify({
      type: 'initialState',
      clientId,
      state: encodeYDoc(sessionData.ydoc),
    }));
    
    // Send list of other clients
    ws.send(JSON.stringify({
      type: 'clientList',
      clients: otherClients
    }));
    
    // Notify other clients about the new client
    broadcastClientJoin(sessionId, clientId, userId, username, client.color);
    
    // Record the participant in the database
    const participantData: InsertSessionParticipant = {
      sessionId,
      userId,
      username,
      clientId,
      joinedAt: new Date(),
      status: 'active',
      color: client.color
    };
    
    await storage.createSessionParticipant(participantData);
    
    // Log the join event
    await storage.createCollaborationEvent({
      sessionId,
      userId,
      username,
      eventType: 'join',
      eventData: JSON.stringify({ clientId }),
      timestamp: new Date()
    });
    
    console.log(`Client ${clientId} (${username}) joined session ${sessionId}`);
    
    return { success: true, clientId };
  } catch (error) {
    console.error('Error adding client to session:', error);
    return { success: false, message: 'Failed to add client to session' };
  }
}

/**
 * Broadcast a client join event to all other clients in a session
 */
function broadcastClientJoin(
  sessionId: string,
  clientId: string,
  userId: number,
  username: string,
  color: string
): void {
  const sessionData = sessions[sessionId];
  if (!sessionData) return;
  
  const message = JSON.stringify({
    type: 'clientJoin',
    clientId,
    userId,
    username,
    color
  });
  
  for (const [otherId, client] of sessionData.clients.entries()) {
    if (otherId !== clientId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

/**
 * Remove a client from a session
 */
export async function removeClientFromSession(clientId: string): Promise<void> {
  // Find the session that contains this client
  for (const [sessionId, sessionData] of Object.entries(sessions)) {
    const client = sessionData.clients.get(clientId);
    
    if (client) {
      // Remove the client from the session
      sessionData.clients.delete(clientId);
      
      // Update participant status in the database
      await updateParticipantStatus(sessionId, clientId, 'disconnected');
      
      // Log the leave event
      await storage.createCollaborationEvent({
        sessionId,
        userId: client.userId,
        username: client.username,
        eventType: 'leave',
        eventData: JSON.stringify({ clientId }),
        timestamp: new Date()
      });
      
      // Notify other clients
      const message = JSON.stringify({
        type: 'clientLeave',
        clientId
      });
      
      for (const [_, otherClient] of sessionData.clients.entries()) {
        if (otherClient.ws.readyState === WebSocket.OPEN) {
          otherClient.ws.send(message);
        }
      }
      
      console.log(`Client ${clientId} left session ${sessionId}`);
      
      // If this was the last client, save the document state
      if (sessionData.clients.size === 0) {
        await saveDocumentVersion(sessionId);
        
        // Consider cleaning up the session from memory
        // if (Object.keys(sessions).length > MAX_INACTIVE_SESSIONS) {
        //   delete sessions[sessionId];
        // }
      }
      
      break;
    }
  }
}

/**
 * Update a participant's status in the database
 */
async function updateParticipantStatus(
  sessionId: string,
  clientId: string,
  status: 'active' | 'inactive' | 'away' | 'disconnected'
): Promise<void> {
  try {
    // Get all participants for this session
    const participants = await storage.getSessionParticipants(sessionId);
    
    // Find the participant by clientId
    const participant = participants.find(p => p.clientId === clientId);
    
    if (participant) {
      // Update status
      await storage.updateSessionParticipant(participant.id, { status });
    }
  } catch (error) {
    console.error('Error updating participant status:', error);
  }
}

/**
 * Create a new collaboration session
 */
export async function createCollaborationSession(
  data: Omit<InsertCollaborationSession, 'sessionId' | 'createdAt' | 'status'>
): Promise<{ success: boolean, message?: string, session?: CollaborationSession }> {
  try {
    // Generate a unique session ID
    const sessionId = uuid();
    
    // Create the session in the database
    const sessionData: InsertCollaborationSession = {
      ...data,
      sessionId,
      createdAt: new Date(),
      status: 'active'
    };
    
    const session = await storage.createCollaborationSession(sessionData);
    
    // Initialize the session in memory
    const ydoc = new Y.Doc();
    
    // Apply initial state if available
    if (data.initialState) {
      try {
        const buffer = Buffer.from(data.initialState, 'base64');
        const update = new Uint8Array(buffer);
        Y.applyUpdate(ydoc, update);
      } catch (error) {
        console.error('Error applying initial state:', error);
      }
    }
    
    // Add session to the in-memory store
    sessions[sessionId] = {
      ydoc,
      clients: new Map(),
      lastUpdate: new Date()
    };
    
    // Log the creation event
    await storage.createCollaborationEvent({
      sessionId,
      userId: data.ownerId,
      username: 'System',
      eventType: 'create',
      eventData: JSON.stringify({
        documentType: data.documentType,
        documentId: data.documentId
      }),
      timestamp: new Date()
    });
    
    return { success: true, session };
  } catch (error) {
    console.error('Error creating collaboration session:', error);
    return { success: false, message: 'Failed to create collaboration session' };
  }
}

/**
 * Handle a comment or annotation in a collaboration session
 */
export async function addComment(
  clientId: string,
  sessionId: string,
  comment: { 
    text: string, 
    position?: { x: number, y: number }, 
    range?: { start: number, end: number } 
  }
): Promise<void> {
  const sessionData = sessions[sessionId];
  if (!sessionData) return;
  
  const client = sessionData.clients.get(clientId);
  if (!client) return;
  
  // Update last activity timestamp
  client.lastActivity = new Date();
  
  // Broadcast to other clients
  const message = JSON.stringify({
    type: 'comment',
    clientId,
    userId: client.userId,
    username: client.username,
    color: client.color,
    comment,
    timestamp: new Date()
  });
  
  for (const [_, otherClient] of sessionData.clients.entries()) {
    if (otherClient.ws.readyState === WebSocket.OPEN) {
      otherClient.ws.send(message);
    }
  }
  
  // Log the comment event
  try {
    await storage.createCollaborationEvent({
      sessionId,
      userId: client.userId,
      username: client.username,
      eventType: 'comment',
      eventData: JSON.stringify(comment),
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error logging comment event:', error);
  }
}

/**
 * Periodic check for inactive sessions to save their state
 */
export function startSessionMaintenanceJob(intervalMinutes: number = 5): NodeJS.Timeout {
  const interval = intervalMinutes * 60 * 1000; // Convert to milliseconds
  
  return setInterval(async () => {
    console.log('Running collaboration session maintenance job');
    
    const now = new Date();
    
    // Process each active session
    for (const [sessionId, sessionData] of Object.entries(sessions)) {
      try {
        // Check if the session has been updated since last save
        const timeSinceUpdate = now.getTime() - sessionData.lastUpdate.getTime();
        
        if (timeSinceUpdate > 60000) { // 1 minute
          // Save the current state
          await saveDocumentVersion(sessionId);
          
          // Update the last update time
          sessionData.lastUpdate = now;
        }
        
        // Check for inactive clients (no activity for 30 minutes)
        for (const [clientId, client] of sessionData.clients.entries()) {
          const timeSinceActivity = now.getTime() - client.lastActivity.getTime();
          
          if (timeSinceActivity > 30 * 60000) { // 30 minutes
            // Update participant status
            await updateParticipantStatus(sessionId, clientId, 'inactive');
            
            // If the client is still connected, send a ping to check
            if (client.ws.readyState === WebSocket.OPEN) {
              client.ws.send(JSON.stringify({ type: 'ping' }));
            } else {
              // WebSocket is not open, remove the client
              await removeClientFromSession(clientId);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing session ${sessionId}:`, error);
      }
    }
  }, interval);
}

export const collaborationService = {
  initializeSession,
  addClientToSession,
  removeClientFromSession,
  processYjsUpdate,
  updateCursorPosition,
  updatePresence,
  createCollaborationSession,
  addComment,
  startSessionMaintenanceJob
};