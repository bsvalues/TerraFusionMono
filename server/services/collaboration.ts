import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import * as Y from 'yjs';
import { storage } from '../storage';
import { 
  DocumentVersion, 
  CollaborationSession, 
  SessionParticipant, 
  CollaborationEvent,
  collaborationEventTypeEnum
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

// Maps sessionId -> YDoc and connected clients
const sessions: YDocMap = {};

// Maps clientId -> WebSocketClient for easy lookup
const clientsMap = new Map<string, WebSocketClient>();

// Color palette for user cursors (hex colors)
const cursorColors = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', 
  '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
  '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
  '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'
];

/**
 * Get a random color from the cursor colors palette
 */
function getRandomColor(): string {
  return cursorColors[Math.floor(Math.random() * cursorColors.length)];
}

/**
 * Encode a Y.js document to a base64 string for storage
 */
function encodeYDoc(ydoc: Y.Doc): string {
  const state = Y.encodeStateAsUpdate(ydoc);
  return Buffer.from(state).toString('base64');
}

/**
 * Decode a base64 string to a Y.js document
 */
function decodeYDoc(base64State: string): Y.Doc {
  const ydoc = new Y.Doc();
  const binaryState = Buffer.from(base64State, 'base64');
  Y.applyUpdate(ydoc, binaryState);
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
  const client = clientsMap.get(clientId);
  if (!client) {
    console.error(`Client ${clientId} not found`);
    return;
  }

  const session = sessions[sessionId];
  if (!session) {
    console.error(`Session ${sessionId} not found`);
    return;
  }

  // Apply update to the Y.js document
  Y.applyUpdate(session.ydoc, update);
  session.lastUpdate = new Date();

  // Log the collaboration event
  await storage.createCollaborationEvent({
    sessionId,
    userId: client.userId,
    eventType: 'update',
    data: { clientId },
    clientId,
  });

  // Broadcast the update to all other clients in the session
  broadcastYjsUpdate(sessionId, update, clientId);

  // Periodically save document versions (e.g., every 10 updates)
  const updatesCount = session.ydoc.store.clients.size;
  if (updatesCount % 10 === 0) {
    await saveDocumentVersion(sessionId);
  }
}

/**
 * Broadcast Y.js update to all clients in a session except the sender
 */
function broadcastYjsUpdate(sessionId: string, update: Uint8Array, excludeClientId: string): void {
  const session = sessions[sessionId];
  if (!session) return;

  const updateBuffer = Buffer.from(update);
  const updateBase64 = updateBuffer.toString('base64');

  for (const [clientId, client] of session.clients) {
    if (clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'yjsUpdate',
        sessionId,
        update: updateBase64
      }));
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
  const client = clientsMap.get(clientId);
  if (!client) return;

  const session = sessions[sessionId];
  if (!session) return;

  // Update the client's position and selection
  client.position = position;
  client.selection = selection;
  client.lastActivity = new Date();

  // Create the cursor update message
  const cursorData = {
    clientId,
    userId: client.userId,
    username: client.username,
    color: client.color,
    position,
    selection
  };

  // Log the cursor movement event
  await storage.createCollaborationEvent({
    sessionId,
    userId: client.userId,
    eventType: 'cursor',
    data: cursorData,
    clientId,
  });

  // Broadcast to all other clients
  for (const [otherClientId, otherClient] of session.clients) {
    if (otherClientId !== clientId && otherClient.ws.readyState === WebSocket.OPEN) {
      otherClient.ws.send(JSON.stringify({
        type: 'cursor',
        data: cursorData
      }));
    }
  }
}

/**
 * Handle client presence update (active, inactive, away)
 */
export async function updatePresence(
  clientId: string,
  sessionId: string,
  presenceState: 'active' | 'inactive' | 'away'
): Promise<void> {
  const client = clientsMap.get(clientId);
  if (!client) return;

  const session = sessions[sessionId];
  if (!session) return;

  // Update client's last activity
  client.lastActivity = new Date();

  // Log the presence event
  await storage.createCollaborationEvent({
    sessionId,
    userId: client.userId,
    eventType: 'presence',
    data: { 
      clientId, 
      userId: client.userId, 
      username: client.username, 
      state: presenceState 
    },
    clientId,
  });

  // Broadcast to all other clients
  for (const [otherClientId, otherClient] of session.clients) {
    if (otherClientId !== clientId && otherClient.ws.readyState === WebSocket.OPEN) {
      otherClient.ws.send(JSON.stringify({
        type: 'presence',
        clientId,
        userId: client.userId,
        username: client.username,
        state: presenceState
      }));
    }
  }

  // Update the database if needed (e.g., if user is leaving)
  if (presenceState === 'away') {
    await updateParticipantStatus(sessionId, client.userId, false);
  }
}

/**
 * Save the current state of a document as a version
 */
async function saveDocumentVersion(sessionId: string): Promise<DocumentVersion | undefined> {
  const session = sessions[sessionId];
  if (!session) return undefined;

  // Get session info from database
  const sessionInfo = await storage.getCollaborationSessionBySessionId(sessionId);
  if (!sessionInfo) return undefined;

  // Encode the document state
  const snapshot = encodeYDoc(session.ydoc);
  
  // Get the highest version currently in the database
  const existingVersions = await storage.getDocumentVersions({
    documentType: sessionInfo.documentType,
    documentId: sessionInfo.documentId,
    limit: 1
  });
  
  const nextVersion = existingVersions.length > 0 
    ? Math.max(...existingVersions.map(v => v.version)) + 1 
    : 1;

  // Save the new version
  const docVersion = await storage.createDocumentVersion({
    sessionId,
    documentType: sessionInfo.documentType,
    documentId: sessionInfo.documentId,
    version: nextVersion,
    snapshot,
    yState: snapshot, // We're storing the same data in both fields for now
    userId: sessionInfo.ownerId, // Use the session owner as the creator
    metadata: {
      clientCount: session.clients.size,
      timestamp: new Date().toISOString()
    }
  });

  return docVersion;
}

/**
 * Initialize a collaboration session
 */
export async function initializeSession(
  sessionId: string, 
  createIfNotExists: boolean = false,
  initialData?: any
): Promise<{ success: boolean, message?: string, session?: CollaborationSession }> {
  // Check if the session already exists in memory
  if (sessions[sessionId]) {
    return { 
      success: true, 
      session: await storage.getCollaborationSessionBySessionId(sessionId)
    };
  }

  // Retrieve the session from database
  let sessionInfo = await storage.getCollaborationSessionBySessionId(sessionId);
  
  if (!sessionInfo && createIfNotExists) {
    // Session doesn't exist yet, so we can't create it without more info
    return { 
      success: false, 
      message: 'Session not found and not enough information to create it' 
    };
  }
  
  if (!sessionInfo) {
    return { success: false, message: 'Session not found' };
  }

  // Initialize a new Y.js document
  const ydoc = new Y.Doc();
  
  // Try to load the latest version from database
  const latestVersion = await storage.getLatestDocumentVersion(
    sessionInfo.documentType, 
    sessionInfo.documentId
  );
  
  if (latestVersion) {
    // Apply the stored state to the document
    try {
      const binaryState = Buffer.from(latestVersion.yState, 'base64');
      Y.applyUpdate(ydoc, binaryState);
    } catch (error) {
      console.error('Error loading document state:', error);
    }
  } else if (initialData) {
    // Initialize with provided data
    // This depends on the document type, here's a simple example for text
    const ytext = ydoc.getText('content');
    if (typeof initialData === 'string') {
      ytext.insert(0, initialData);
    } else if (initialData.text) {
      ytext.insert(0, initialData.text);
    }
    
    // Save the initial version
    await storage.createDocumentVersion({
      sessionId,
      documentType: sessionInfo.documentType,
      documentId: sessionInfo.documentId,
      version: 1,
      snapshot: encodeYDoc(ydoc),
      yState: encodeYDoc(ydoc),
      userId: sessionInfo.ownerId,
      metadata: { initial: true }
    });
  }

  // Store the session in memory
  sessions[sessionId] = {
    ydoc,
    clients: new Map(),
    lastUpdate: new Date()
  };

  // Update the session status to active
  await storage.updateCollaborationSession(sessionInfo.id, {
    status: 'active',
    lastActivity: new Date()
  });

  // Get the updated session info
  sessionInfo = await storage.getCollaborationSessionBySessionId(sessionId);

  return { success: true, session: sessionInfo };
}

/**
 * Add a client to a collaboration session
 */
export async function addClientToSession(
  ws: WebSocket,
  sessionId: string,
  userId: number,
  username: string
): Promise<{ success: boolean, clientId?: string, message?: string }> {
  // Check if the session exists
  const session = sessions[sessionId];
  if (!session) {
    return { success: false, message: 'Session not found' };
  }

  // Generate a client ID
  const clientId = uuidv4();
  
  // Assign a random color to the user
  const color = getRandomColor();
  
  // Create the client object
  const client: WebSocketClient = {
    userId,
    username,
    sessionId,
    clientId,
    ws,
    color,
    lastActivity: new Date()
  };
  
  // Store the client
  session.clients.set(clientId, client);
  clientsMap.set(clientId, client);
  
  // Update the participant in the database
  await updateParticipantStatus(sessionId, userId, true);
  
  // Log the join event
  await storage.createCollaborationEvent({
    sessionId,
    userId,
    eventType: 'join',
    data: { 
      clientId, 
      username, 
      color 
    },
    clientId,
  });
  
  // Send the current state to the new client
  const stateUpdate = Y.encodeStateAsUpdate(session.ydoc);
  const stateBase64 = Buffer.from(stateUpdate).toString('base64');
  
  ws.send(JSON.stringify({
    type: 'initialState',
    clientId,
    sessionId,
    state: stateBase64,
    color
  }));
  
  // Notify other clients about the new client
  broadcastClientJoin(sessionId, clientId, userId, username, color);
  
  // Send the current presence of all clients to the new client
  const clients = Array.from(session.clients.entries())
    .filter(([otherId]) => otherId !== clientId)
    .map(([otherId, otherClient]) => ({
      clientId: otherId,
      userId: otherClient.userId,
      username: otherClient.username,
      color: otherClient.color,
      position: otherClient.position,
      selection: otherClient.selection
    }));
  
  ws.send(JSON.stringify({
    type: 'clientList',
    clients
  }));
  
  return { success: true, clientId };
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
  const session = sessions[sessionId];
  if (!session) return;
  
  for (const [otherId, client] of session.clients) {
    if (otherId !== clientId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'clientJoin',
        clientId,
        userId,
        username,
        color
      }));
    }
  }
}

/**
 * Remove a client from a session
 */
export async function removeClientFromSession(clientId: string): Promise<void> {
  const client = clientsMap.get(clientId);
  if (!client) return;
  
  const { sessionId, userId, username } = client;
  const session = sessions[sessionId];
  if (!session) return;
  
  // Remove the client
  session.clients.delete(clientId);
  clientsMap.delete(clientId);
  
  // Log the leave event
  await storage.createCollaborationEvent({
    sessionId,
    userId,
    eventType: 'leave',
    data: { 
      clientId, 
      username 
    },
    clientId,
  });
  
  // If this was the last client, save the final state and clean up
  if (session.clients.size === 0) {
    await saveDocumentVersion(sessionId);
    delete sessions[sessionId];
    
    // Update the session status
    const sessionInfo = await storage.getCollaborationSessionBySessionId(sessionId);
    if (sessionInfo) {
      await storage.updateCollaborationSession(sessionInfo.id, {
        status: 'paused',
        lastActivity: new Date()
      });
    }
  } else {
    // Notify other clients
    for (const [, client] of session.clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: 'clientLeave',
          clientId,
          userId,
          username
        }));
      }
    }
  }
  
  // Update the participant status in the database
  await updateParticipantStatus(sessionId, userId, false);
}

/**
 * Update a participant's status in the database
 */
async function updateParticipantStatus(
  sessionId: string, 
  userId: number, 
  isActive: boolean
): Promise<void> {
  // Check if the participant exists
  const participant = await storage.getActiveSessionParticipant(sessionId, userId);
  
  if (participant) {
    if (isActive) {
      // Update the participant's activity timestamp
      await storage.updateSessionParticipant(participant.id, {
        isActive: true,
        lastActivity: new Date()
      });
    } else {
      // Mark the participant as inactive
      await storage.updateSessionParticipant(participant.id, {
        isActive: false,
        leftAt: new Date()
      });
    }
  } else if (isActive) {
    // Create a new participant entry
    await storage.createSessionParticipant({
      sessionId,
      userId,
      isActive: true,
      color: getRandomColor()
    });
  }
}

/**
 * Create a new collaboration session
 */
export async function createCollaborationSession(
  ownerId: number, 
  documentType: string, 
  documentId: string, 
  name: string,
  initialData?: any
): Promise<{ success: boolean, sessionId?: string, message?: string }> {
  try {
    // Create a session ID
    const sessionId = uuidv4();
    
    // Create the session in the database
    const session = await storage.createCollaborationSession({
      sessionId,
      name,
      documentType,
      documentId,
      ownerId,
      status: 'active',
      metadata: { createdAt: new Date().toISOString() },
      config: { allowAnonymous: false, autoSave: true }
    });
    
    // Initialize the session
    const result = await initializeSession(sessionId, false, initialData);
    
    if (!result.success) {
      return { success: false, message: result.message };
    }
    
    return { success: true, sessionId };
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
  const client = clientsMap.get(clientId);
  if (!client) return;
  
  const session = sessions[sessionId];
  if (!session) return;
  
  // Log the comment event
  await storage.createCollaborationEvent({
    sessionId,
    userId: client.userId,
    eventType: 'comment',
    data: { 
      clientId, 
      userId: client.userId,
      username: client.username,
      comment,
      timestamp: new Date().toISOString()
    },
    clientId,
  });
  
  // Broadcast to all other clients
  for (const [otherId, otherClient] of session.clients) {
    if (otherId !== clientId && otherClient.ws.readyState === WebSocket.OPEN) {
      otherClient.ws.send(JSON.stringify({
        type: 'comment',
        clientId,
        userId: client.userId,
        username: client.username,
        comment
      }));
    }
  }
}

/**
 * Periodic check for inactive sessions to save their state
 */
export function startSessionMaintenanceJob(intervalMinutes: number = 5): NodeJS.Timeout {
  return setInterval(async () => {
    const now = new Date();
    
    for (const [sessionId, session] of Object.entries(sessions)) {
      // Check if the session has been inactive for too long
      const timeSinceLastUpdate = now.getTime() - session.lastUpdate.getTime();
      
      // Save the state periodically regardless of activity
      if (timeSinceLastUpdate > 5 * 60 * 1000) { // 5 minutes
        await saveDocumentVersion(sessionId);
        session.lastUpdate = now;
      }
      
      // If session has been inactive for too long, clean it up
      if (session.clients.size === 0 && timeSinceLastUpdate > 30 * 60 * 1000) { // 30 minutes
        delete sessions[sessionId];
        
        // Update the session status
        const sessionInfo = await storage.getCollaborationSessionBySessionId(sessionId);
        if (sessionInfo) {
          await storage.updateCollaborationSession(sessionInfo.id, {
            status: 'completed',
            lastActivity: now
          });
        }
      }
    }
  }, intervalMinutes * 60 * 1000);
}

// Export the collaboration service
export const collaborationService = {
  initializeSession,
  createCollaborationSession,
  addClientToSession,
  removeClientFromSession,
  processYjsUpdate,
  updateCursorPosition,
  updatePresence,
  addComment,
  startSessionMaintenanceJob
};