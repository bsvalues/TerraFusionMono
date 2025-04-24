import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { collaborationStorage } from './collaboration-storage';
import * as Y from 'yjs';
import { v4 as uuid } from 'uuid';
import jwt from 'jsonwebtoken';

// Secret for signing tokens (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'terra-fusion-collaboration-secret';

// Interface to represent a connected client
interface ConnectedClient {
  ws: WebSocket;
  clientId: string;
  userId?: number;
  username?: string;
  authenticated: boolean;
  sessionId?: string;
  color?: string;
}

/**
 * WebSocket Collaboration Service
 * Handles real-time collaboration using Y.js and WebSockets
 */
export class CollaborationService {
  private wss: WebSocketServer;
  private clients: Map<string, ConnectedClient> = new Map();
  private sessions: Map<string, Set<string>> = new Map(); // sessionId -> Set of clientIds
  private ydocs: Map<string, Y.Doc> = new Map(); // sessionId -> Y.Doc instance
  
  constructor(server: Server) {
    // Initialize WebSocket server
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/collaboration'
    });
    
    // Set up event handlers
    this.setupWebSocketServer();
    
    // Set up periodic cleanup
    this.setupPeriodicCleanup();
    
    console.log('Collaboration Service initialized');
  }
  
  private setupWebSocketServer() {
    this.wss.on('connection', (ws) => {
      // Create a unique client ID
      const clientId = uuid();
      
      // Store the client
      this.clients.set(clientId, {
        ws,
        clientId,
        authenticated: false
      });
      
      // Send welcome message
      this.sendToClient(clientId, {
        type: 'welcome',
        message: 'Connected to TerraFusion Collaboration Service',
        clientId
      });
      
      // Set up client event handlers
      this.setupClientEventHandlers(clientId, ws);
      
      console.log(`Client ${clientId} connected`);
    });
    
    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });
    
    // Handle server close
    this.wss.on('close', () => {
      console.log('WebSocket server closed');
      // Clean up resources
      this.clients.clear();
      this.sessions.clear();
      this.ydocs.clear();
    });
  }
  
  private setupClientEventHandlers(clientId: string, ws: WebSocket) {
    // Handle messages from the client
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        await this.handleClientMessage(clientId, data);
      } catch (error) {
        console.error(`Error handling message from client ${clientId}:`, error);
        this.sendToClient(clientId, {
          type: 'error',
          message: 'Invalid message format or server error'
        });
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      this.handleClientDisconnect(clientId);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error(`Error with client ${clientId}:`, error);
      this.handleClientDisconnect(clientId);
    });
    
    // Handle pings to keep connection alive
    ws.on('pong', () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.ws.isAlive = true;
      }
    });
  }
  
  private async handleClientMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) {
      console.error(`Received message from unknown client: ${clientId}`);
      return;
    }
    
    console.log(`Received ${message.type} message from client ${clientId}`);
    
    switch (message.type) {
      case 'ping':
        // Respond with pong to keep connection alive
        this.sendToClient(clientId, { type: 'pong' });
        break;
        
      case 'auth':
        await this.handleAuthentication(clientId, message);
        break;
        
      case 'join_session':
        if (!client.authenticated) {
          this.sendToClient(clientId, {
            type: 'error',
            message: 'Authentication required before joining a session'
          });
          return;
        }
        
        await this.handleJoinSession(
          clientId, 
          message.sessionId, 
          message.username || client.username || 'Anonymous'
        );
        break;
        
      case 'leave_session':
        await this.handleLeaveSession(clientId);
        break;
        
      case 'update':
        if (!client.authenticated || !client.sessionId) {
          this.sendToClient(clientId, {
            type: 'error',
            message: 'Authentication and joining a session is required before sending updates'
          });
          return;
        }
        
        await this.handleUpdate(clientId, message.update);
        break;
        
      case 'cursor':
        if (!client.authenticated || !client.sessionId) {
          return; // Silently ignore cursor updates if not authenticated or not in a session
        }
        
        await this.handleCursorUpdate(
          clientId, 
          message.position, 
          message.selection
        );
        break;
        
      case 'presence':
        if (!client.authenticated || !client.sessionId) {
          return; // Silently ignore presence updates if not authenticated or not in a session
        }
        
        await this.handlePresenceUpdate(clientId, message.state);
        break;
        
      case 'comment':
        if (!client.authenticated || !client.sessionId) {
          this.sendToClient(clientId, {
            type: 'error',
            message: 'Authentication and joining a session is required before adding comments'
          });
          return;
        }
        
        await this.handleComment(clientId, message.comment);
        break;
        
      default:
        this.sendToClient(clientId, {
          type: 'error',
          message: `Unknown message type: ${message.type}`
        });
    }
  }
  
  private async handleAuthentication(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    try {
      // For demo purposes, we'll accept a simple token
      // In production, you'd want to verify against a real auth system
      if (message.token === 'demo-token') {
        // Demo authentication - for testing only
        client.authenticated = true;
        client.userId = message.userId || 1;
        client.username = message.username || 'Demo User';
        
        this.sendToClient(clientId, {
          type: 'auth_success',
          userId: client.userId,
          username: client.username
        });
        
        console.log(`Client ${clientId} authenticated as ${client.username} (${client.userId})`);
      } else {
        // Attempt to verify the JWT token
        try {
          const decoded = jwt.verify(message.token, JWT_SECRET) as any;
          client.authenticated = true;
          client.userId = decoded.userId;
          client.username = decoded.username;
          
          this.sendToClient(clientId, {
            type: 'auth_success',
            userId: client.userId,
            username: client.username
          });
          
          console.log(`Client ${clientId} authenticated as ${client.username} (${client.userId})`);
        } catch (tokenError) {
          throw new Error('Invalid token');
        }
      }
    } catch (error) {
      console.error(`Authentication error for client ${clientId}:`, error);
      
      this.sendToClient(clientId, {
        type: 'auth_error',
        message: error.message || 'Authentication failed'
      });
    }
  }
  
  private async handleJoinSession(clientId: string, sessionId: string, username: string) {
    const client = this.clients.get(clientId);
    if (!client || !client.userId) return;
    
    try {
      // Get or create the session
      let session = await collaborationStorage.getSession(sessionId);
      
      if (!session) {
        // Temporary for demo: Create a session if it doesn't exist
        session = await collaborationStorage.createSession({
          sessionId,
          name: `${username}'s Collaboration Session`,
          documentType: 'text-document',
          documentId: 'demo-' + Date.now(),
          ownerId: client.userId,
          status: 'active',
          description: 'A demo collaboration session',
        });
      }
      
      // Update the session's last activity
      await collaborationStorage.updateLastActivity(sessionId);
      
      // Add the client to the session
      client.sessionId = sessionId;
      
      // Assign a random color to the client
      client.color = this.getRandomColor();
      
      // Add or update the client in the session participants
      await collaborationStorage.addParticipant({
        sessionId,
        userId: client.userId,
        isActive: true,
        color: client.color,
      });
      
      // Get or create the session's client set
      if (!this.sessions.has(sessionId)) {
        this.sessions.set(sessionId, new Set());
      }
      
      // Add the client to the session
      this.sessions.get(sessionId)?.add(clientId);
      
      // Get or create the Y document for this session
      let ydoc: Y.Doc;
      if (!this.ydocs.has(sessionId)) {
        ydoc = new Y.Doc();
        this.ydocs.set(sessionId, ydoc);
        
        // Try to load the document state from the database
        const latestVersion = await collaborationStorage.getLatestDocumentVersion(
          session.documentType,
          session.documentId
        );
        
        if (latestVersion && latestVersion.yState) {
          try {
            // Apply the saved state to the Y.js document
            const stateUpdate = Uint8Array.from(
              atob(latestVersion.yState), 
              c => c.charCodeAt(0)
            );
            Y.applyUpdate(ydoc, stateUpdate);
          } catch (error) {
            console.error(`Error applying saved state to Y.doc for session ${sessionId}:`, error);
          }
        }
      } else {
        ydoc = this.ydocs.get(sessionId)!;
      }
      
      // Get the current state of the document
      const state = Y.encodeStateAsUpdate(ydoc);
      const stateBase64 = btoa(String.fromCharCode(...state));
      
      // Send the initial state to the client
      this.sendToClient(clientId, {
        type: 'initialState',
        clientId,
        state: stateBase64,
        username: client.username,
        color: client.color
      });
      
      // Get the list of other participants
      const participants = await collaborationStorage.getParticipants(sessionId);
      
      // Convert participants to client list
      const clientList = participants.map(p => ({
        clientId: p.id.toString(), // Use participant ID as client ID for participants from DB
        userId: p.userId,
        username: `User ${p.userId}`, // In a real app, you'd fetch usernames
        color: p.color,
        position: p.cursorPosition,
        selection: p.selection,
        presence: p.presence
      }));
      
      // Send the client list to the new client
      this.sendToClient(clientId, {
        type: 'clientList',
        clients: clientList
      });
      
      // Notify other clients in the session about the new client
      this.broadcastToSession(sessionId, clientId, {
        type: 'clientJoin',
        clientId,
        userId: client.userId,
        username: client.username,
        color: client.color
      });
      
      // Record the join event
      await collaborationStorage.recordEvent({
        sessionId,
        userId: client.userId,
        eventType: 'join',
        clientId,
        data: {
          username: client.username,
          color: client.color
        }
      });
      
      console.log(`Client ${clientId} (${client.username}) joined session ${sessionId}`);
    } catch (error) {
      console.error(`Error joining session for client ${clientId}:`, error);
      
      this.sendToClient(clientId, {
        type: 'error',
        message: error.message || 'Failed to join session'
      });
    }
  }
  
  private async handleLeaveSession(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client || !client.sessionId || !client.userId) return;
    
    const sessionId = client.sessionId;
    
    try {
      // Remove client from session
      this.sessions.get(sessionId)?.delete(clientId);
      
      // If no clients left in session, clean up
      if (this.sessions.get(sessionId)?.size === 0) {
        this.sessions.delete(sessionId);
        
        // Persist the final state of the document
        await this.persistDocumentState(sessionId, client.userId);
        
        this.ydocs.delete(sessionId);
      } else {
        // Notify other clients
        this.broadcastToSession(sessionId, clientId, {
          type: 'clientLeave',
          clientId,
          userId: client.userId
        });
      }
      
      // Update participant status in database
      await collaborationStorage.removeParticipant(sessionId, client.userId);
      
      // Record the leave event
      await collaborationStorage.recordEvent({
        sessionId,
        userId: client.userId,
        eventType: 'leave',
        clientId,
        data: {}
      });
      
      // Clear session info from client
      client.sessionId = undefined;
      
      console.log(`Client ${clientId} (${client.username}) left session ${sessionId}`);
    } catch (error) {
      console.error(`Error leaving session for client ${clientId}:`, error);
    }
  }
  
  private async handleUpdate(clientId: string, updateBase64: string) {
    const client = this.clients.get(clientId);
    if (!client || !client.sessionId || !client.userId) return;
    
    const sessionId = client.sessionId;
    
    try {
      // Get the Y.js document for this session
      const ydoc = this.ydocs.get(sessionId);
      if (!ydoc) {
        throw new Error('Document not found for this session');
      }
      
      // Convert the base64 update to a Uint8Array
      const update = Uint8Array.from(atob(updateBase64), c => c.charCodeAt(0));
      
      // Apply the update to the Y.js document
      Y.applyUpdate(ydoc, update);
      
      // Broadcast the update to other clients in the session
      this.broadcastToSession(sessionId, clientId, {
        type: 'yjsUpdate',
        update: updateBase64,
        clientId
      });
      
      // Record the update event (consider performance implications of recording every update)
      // For high-frequency updates, consider batching or periodic snapshots instead
      await collaborationStorage.recordEvent({
        sessionId,
        userId: client.userId,
        eventType: 'update',
        clientId,
        data: {}
      });
      
      // Periodically persist the document state for recovery
      // For simplicity, here we'll do it for every 10th update based on a clientId hash
      if (this.shouldPersistUpdate(clientId)) {
        await this.persistDocumentState(sessionId, client.userId);
      }
    } catch (error) {
      console.error(`Error processing update for client ${clientId}:`, error);
      
      this.sendToClient(clientId, {
        type: 'error',
        message: error.message || 'Failed to process update'
      });
    }
  }
  
  private async handleCursorUpdate(
    clientId: string, 
    position: any, 
    selection?: any
  ) {
    const client = this.clients.get(clientId);
    if (!client || !client.sessionId || !client.userId) return;
    
    const sessionId = client.sessionId;
    
    try {
      // Update the participant's cursor position in the database
      await collaborationStorage.updateCursorPosition(
        sessionId,
        client.userId,
        position,
        selection
      );
      
      // Broadcast the cursor update to other clients
      this.broadcastToSession(sessionId, clientId, {
        type: 'cursor',
        data: {
          clientId,
          userId: client.userId,
          position,
          selection
        }
      });
    } catch (error) {
      console.error(`Error updating cursor for client ${clientId}:`, error);
    }
  }
  
  private async handlePresenceUpdate(clientId: string, state: 'active' | 'inactive' | 'away') {
    const client = this.clients.get(clientId);
    if (!client || !client.sessionId || !client.userId) return;
    
    const sessionId = client.sessionId;
    
    try {
      // Update the participant's presence in the database
      await collaborationStorage.updatePresence(
        sessionId,
        client.userId,
        { state }
      );
      
      // Broadcast the presence update to other clients
      this.broadcastToSession(sessionId, clientId, {
        type: 'presence',
        clientId,
        userId: client.userId,
        state
      });
    } catch (error) {
      console.error(`Error updating presence for client ${clientId}:`, error);
    }
  }
  
  private async handleComment(clientId: string, comment: any) {
    const client = this.clients.get(clientId);
    if (!client || !client.sessionId || !client.userId) return;
    
    const sessionId = client.sessionId;
    
    try {
      // Record the comment event
      await collaborationStorage.recordEvent({
        sessionId,
        userId: client.userId,
        eventType: 'comment',
        clientId,
        data: {
          text: comment.text,
          position: comment.position,
          range: comment.range
        }
      });
      
      // Broadcast the comment to other clients
      this.broadcastToSession(sessionId, clientId, {
        type: 'comment',
        clientId,
        userId: client.userId,
        username: client.username,
        text: comment.text,
        position: comment.position,
        range: comment.range,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error adding comment for client ${clientId}:`, error);
      
      this.sendToClient(clientId, {
        type: 'error',
        message: error.message || 'Failed to add comment'
      });
    }
  }
  
  private async handleClientDisconnect(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    console.log(`Client ${clientId} disconnected`);
    
    // If client was in a session, remove them
    if (client.sessionId) {
      await this.handleLeaveSession(clientId);
    }
    
    // Remove the client
    this.clients.delete(clientId);
  }
  
  // Helper methods
  private sendToClient(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    try {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error(`Error sending message to client ${clientId}:`, error);
      // If we can't send to a client, consider them disconnected
      this.handleClientDisconnect(clientId);
    }
  }
  
  private broadcastToSession(sessionId: string, excludeClientId: string, message: any) {
    const clientIds = this.sessions.get(sessionId);
    if (!clientIds) return;
    
    for (const clientId of clientIds) {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
      }
    }
  }
  
  private async persistDocumentState(sessionId: string, userId: number) {
    try {
      const ydoc = this.ydocs.get(sessionId);
      if (!ydoc) return;
      
      // Get the session details
      const session = await collaborationStorage.getSession(sessionId);
      if (!session) return;
      
      // Get the current state of the document
      const state = Y.encodeStateAsUpdate(ydoc);
      const stateBase64 = btoa(String.fromCharCode(...state));
      
      // Get the latest version number and increment it
      const latestVersion = await collaborationStorage.getLatestDocumentVersion(
        session.documentType,
        session.documentId
      );
      
      const version = latestVersion ? latestVersion.version + 1 : 1;
      
      // Save the new version
      await collaborationStorage.saveDocumentVersion({
        sessionId,
        documentType: session.documentType,
        documentId: session.documentId,
        version,
        snapshot: stateBase64, // Full document state
        yState: stateBase64,   // Y.js state
        userId,
        metadata: {
          timestamp: new Date().toISOString()
        }
      });
      
      console.log(`Persisted document state for session ${sessionId}, version ${version}`);
    } catch (error) {
      console.error(`Error persisting document state for session ${sessionId}:`, error);
    }
  }
  
  private shouldPersistUpdate(clientId: string): boolean {
    // A simple heuristic: persist every 10th update based on the hash of the clientId
    const hash = clientId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return hash % 10 === 0;
  }
  
  private getRandomColor(): string {
    // Generate a random color from a nice palette
    const colors = [
      '#3498db', // Blue
      '#2ecc71', // Green
      '#e74c3c', // Red
      '#f39c12', // Orange
      '#9b59b6', // Purple
      '#1abc9c', // Turquoise
      '#d35400', // Pumpkin
      '#2c3e50', // Dark Blue
      '#27ae60', // Nephritis
      '#c0392b', // Pomegranate
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  private setupPeriodicCleanup() {
    // Send pings to all clients every 30 seconds to keep connections alive
    setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (client.ws.isAlive === false) {
          console.log(`Client ${clientId} is unresponsive, terminating connection`);
          client.ws.terminate();
          this.handleClientDisconnect(clientId);
          return;
        }
        
        client.ws.isAlive = false;
        client.ws.ping();
      });
    }, 30000);
    
    // Clean up inactive sessions and old events once a day
    setInterval(async () => {
      try {
        // Archive sessions that have been inactive for 30 days
        const archivedCount = await collaborationStorage.cleanupInactiveSessions(30);
        console.log(`Archived ${archivedCount} inactive sessions`);
        
        // Purge events older than 90 days
        const purgedCount = await collaborationStorage.purgeOldEvents(90);
        console.log(`Purged ${purgedCount} old events`);
      } catch (error) {
        console.error('Error during periodic cleanup:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours
  }
}

// Augment WebSocket type with isAlive property
declare module 'ws' {
  interface WebSocket {
    isAlive: boolean;
  }
}