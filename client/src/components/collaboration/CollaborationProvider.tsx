import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import * as Y from 'yjs';

interface CollaborationContextType {
  isConnected: boolean;
  isAuthenticated: boolean;
  isJoined: boolean;
  error: string | null;
  sessionId: string | null;
  clientId: string | null;
  participants: Participant[];
  connectToSession: (sessionId: string, token: string, userId: number, username: string) => void;
  disconnectFromSession: () => void;
  sendUpdate: (update: Uint8Array) => void;
  updateCursor: (position: { x: number, y: number }, selection?: { anchor: number, head: number }) => void;
  updatePresence: (state: 'active' | 'inactive' | 'away') => void;
  addComment: (comment: { text: string, position?: { x: number, y: number }, range?: { start: number, end: number } }) => void;
  getYDoc: () => Y.Doc | null;
}

interface Participant {
  clientId: string;
  userId: number;
  username: string;
  color: string;
  position?: { x: number, y: number };
  selection?: { anchor: number, head: number };
  presence?: 'active' | 'inactive' | 'away';
  joinedAt: Date;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

interface CollaborationProviderProps {
  children: React.ReactNode | ((context: CollaborationContextType) => React.ReactNode);
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  
  // Clean up function
  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }
    
    setIsConnected(false);
    setIsAuthenticated(false);
    setIsJoined(false);
    setSessionId(null);
    setClientId(null);
    setParticipants([]);
  }, []);
  
  // Reconnection mechanism
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Connect to a collaboration session with reconnection logic
  const connectToSession = useCallback((
    sessionId: string, 
    token: string, 
    userId: number, 
    username: string
  ) => {
    // Store connection info for reconnection attempts
    const connectionInfo = { sessionId, token, userId, username };
    
    // Clean up any existing connection
    cleanup();
    
    // Reset reconnection state
    setReconnectAttempts(0);
    setIsReconnecting(false);
    
    // Create a new Y.js document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    
    // Set up WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/collaboration`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    // Set the initial states
    setError(null);
    setSessionId(sessionId);
    
    // Set up reconnection logic
    const attemptReconnect = () => {
      if (reconnectAttempts >= maxReconnectAttempts) {
        setError('Could not reconnect after several attempts. Please try again later.');
        setIsReconnecting(false);
        return;
      }
      
      setIsReconnecting(true);
      setReconnectAttempts(prev => prev + 1);
      
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connectToSession(connectionInfo.sessionId, connectionInfo.token, connectionInfo.userId, connectionInfo.username);
      }, delay);
    };
    
    // Set up event handlers
    ws.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      setIsReconnecting(false);
      setReconnectAttempts(0);
      
      // Authenticate
      ws.send(JSON.stringify({
        type: 'auth',
        token,
        userId
      }));
    };
    
    ws.onclose = (event) => {
      console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
      
      // Don't attempt to reconnect if this was a clean closure or we're manually disconnecting
      if (event.code === 1000 || event.code === 1001) {
        cleanup();
        return;
      }
      
      // Keep session information but mark as disconnected
      setIsConnected(false);
      setIsJoined(false);
      
      // Attempt to reconnect
      attemptReconnect();
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setError('Connection error. Attempting to reconnect...');
      // The onclose handler will be called after this and will handle reconnection
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received message:', message);
        
        switch (message.type) {
          case 'welcome':
            // We're connected, but not authenticated yet
            console.log('Received welcome message');
            break;
            
          case 'auth_success':
            console.log('Authentication successful');
            setIsAuthenticated(true);
            
            // Now we can join the session
            ws.send(JSON.stringify({
              type: 'join_session',
              sessionId,
              username
            }));
            break;
            
          case 'auth_error':
            console.error('Authentication error:', message.message);
            setError(`Authentication error: ${message.message}`);
            setIsAuthenticated(false);
            break;
            
          case 'error':
            console.error('Error message:', message.message);
            setError(message.message);
            break;
            
          case 'initialState':
            // We've successfully joined the session
            console.log('Joined session, received initial state');
            setIsJoined(true);
            setClientId(message.clientId);
            
            // Apply initial state to Y.js document
            if (message.state) {
              const stateUpdate = Uint8Array.from(atob(message.state), c => c.charCodeAt(0));
              Y.applyUpdate(ydoc, stateUpdate);
            }
            break;
            
          case 'clientList':
            // Received list of other clients in the session
            if (message.clients) {
              const newParticipants = message.clients.map((client: any) => ({
                clientId: client.clientId,
                userId: client.userId,
                username: client.username,
                color: client.color,
                position: client.position,
                selection: client.selection,
                joinedAt: new Date()
              }));
              
              setParticipants(newParticipants);
            }
            break;
            
          case 'clientJoin':
            // A new client has joined the session
            setParticipants(prev => [
              ...prev,
              {
                clientId: message.clientId,
                userId: message.userId,
                username: message.username,
                color: message.color,
                joinedAt: new Date()
              }
            ]);
            break;
            
          case 'clientLeave':
            // A client has left the session
            setParticipants(prev => prev.filter(p => p.clientId !== message.clientId));
            break;
            
          case 'yjsUpdate':
            // Received an update to the Y.js document
            if (message.update) {
              const update = Uint8Array.from(atob(message.update), c => c.charCodeAt(0));
              Y.applyUpdate(ydoc, update);
            }
            break;
            
          case 'cursor':
            // Update cursor position for a participant
            setParticipants(prev => {
              const index = prev.findIndex(p => p.clientId === message.data.clientId);
              if (index === -1) return prev;
              
              const newParticipants = [...prev];
              newParticipants[index] = {
                ...newParticipants[index],
                position: message.data.position,
                selection: message.data.selection
              };
              
              return newParticipants;
            });
            break;
            
          case 'presence':
            // Update presence state for a participant
            setParticipants(prev => {
              const index = prev.findIndex(p => p.clientId === message.clientId);
              if (index === -1) return prev;
              
              const newParticipants = [...prev];
              newParticipants[index] = {
                ...newParticipants[index],
                presence: message.state
              };
              
              return newParticipants;
            });
            break;
            
          case 'comment':
            // Add a comment notification (we'll let the application handle this)
            // You could add this to an array of comments or trigger a notification
            console.log('Received comment:', message);
            break;
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    };
    
  }, [cleanup]);
  
  // Disconnect from the session
  const disconnectFromSession = useCallback(() => {
    cleanup();
  }, [cleanup]);
  
  // Send a Y.js update
  const sendUpdate = useCallback((update: Uint8Array) => {
    if (!wsRef.current || !isJoined) return;
    
    // Convert the update to a base64 string
    const updateBase64 = btoa(String.fromCharCode(...update));
    
    wsRef.current.send(JSON.stringify({
      type: 'update',
      update: updateBase64
    }));
  }, [isJoined]);
  
  // Update cursor position
  const updateCursor = useCallback((
    position: { x: number, y: number },
    selection?: { anchor: number, head: number }
  ) => {
    if (!wsRef.current || !isJoined) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'cursor',
      position,
      selection
    }));
  }, [isJoined]);
  
  // Update presence state
  const updatePresence = useCallback((state: 'active' | 'inactive' | 'away') => {
    if (!wsRef.current || !isJoined) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'presence',
      state
    }));
  }, [isJoined]);
  
  // Add a comment
  const addComment = useCallback((comment: { 
    text: string, 
    position?: { x: number, y: number }, 
    range?: { start: number, end: number } 
  }) => {
    if (!wsRef.current || !isJoined) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'comment',
      comment
    }));
  }, [isJoined]);
  
  // Get the Y.js document
  const getYDoc = useCallback(() => {
    return ydocRef.current;
  }, []);
  
  // Set up a ping interval to keep the connection alive
  useEffect(() => {
    if (!isConnected) return;
    
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(pingInterval);
    };
  }, [isConnected]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);
  
  const value = {
    isConnected,
    isAuthenticated,
    isJoined,
    error,
    sessionId,
    clientId,
    participants,
    connectToSession,
    disconnectFromSession,
    sendUpdate,
    updateCursor,
    updatePresence,
    addComment,
    getYDoc
  };
  
  return (
    <CollaborationContext.Provider value={value}>
      {typeof children === 'function' ? children(value) : children}
    </CollaborationContext.Provider>
  );
};

export const useCollaboration = (): CollaborationContextType => {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};