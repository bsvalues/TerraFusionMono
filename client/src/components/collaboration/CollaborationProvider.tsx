import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { UserRound, Wifi, WifiOff, Clock, X } from 'lucide-react';

// Define typings
export type CollaborationStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

export interface Participant {
  clientId: string;
  userId: number;
  username: string;
  color: string;
  position?: any;
  selection?: any;
  presence?: any;
}

export interface CollaborationContextValue {
  // Connection state
  status: CollaborationStatus;
  connect: (sessionId: string, token: string) => void;
  disconnect: () => void;
  
  // Y.js document
  ydoc?: Y.Doc;
  
  // Participants
  participants: Participant[];
  
  // Session data
  sessionId?: string;
  userId?: number;
  username?: string;
  
  // Updates
  sendUpdate: (update: Uint8Array) => void;
  sendCursorUpdate: (position: any, selection?: any) => void;
  sendPresenceUpdate: (presence: any) => void;
  sendComment: (comment: any) => void;
}

// Create the context
const CollaborationContext = createContext<CollaborationContextValue | undefined>(undefined);

// Custom hook to use the collaboration context
export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};

export interface CollaborationProviderProps {
  children: React.ReactNode;
  initialSessionId?: string;
  initialToken?: string;
  autoConnect?: boolean;
  showUI?: boolean;
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({
  children,
  initialSessionId,
  initialToken,
  autoConnect = false,
  showUI = true
}) => {
  // State
  const [status, setStatus] = useState<CollaborationStatus>('disconnected');
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  const [userId, setUserId] = useState<number | undefined>();
  const [username, setUsername] = useState<string | undefined>();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [ydoc, setYdoc] = useState<Y.Doc>();
  
  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  
  // Keep track of reconnection attempts
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Toast notifications
  const { toast } = useToast();
  
  // Connect to a collaboration session
  const connect = (newSessionId: string, token: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      disconnect();
    }
    
    setSessionId(newSessionId);
    
    try {
      // Reset reconnection attempts
      reconnectAttemptsRef.current = 0;
      
      // Create WebSocket connection with proper protocol
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws/collaboration`;
      
      setStatus('connecting');
      
      // Create a new WebSocket
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      // Setup event handlers
      ws.onopen = () => {
        console.log('WebSocket connection established');
        
        // Authenticate immediately after connection is established
        ws.send(JSON.stringify({
          type: 'auth',
          token
        }));
      };
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleServerMessage(message);
      };
      
      ws.onclose = (event) => {
        console.log('WebSocket connection closed', event.code, event.reason);
        
        // Update status
        if (status !== 'error') {
          setStatus('disconnected');
        }
        
        // Schedule reconnection attempt if not a clean close
        if (event.code !== 1000) {
          scheduleReconnection(newSessionId, token);
        }
        
        // Clean up Y.js document
        setYdoc(undefined);
        setParticipants([]);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus('error');
        
        toast({
          title: "Connection Error",
          description: "Failed to connect to collaboration server",
          variant: "destructive"
        });
      };
    } catch (error) {
      console.error('Error connecting to collaboration server:', error);
      setStatus('error');
      
      toast({
        title: "Connection Error",
        description: "Failed to connect to collaboration server",
        variant: "destructive"
      });
    }
  };
  
  // Handle WebSocket reconnection
  const scheduleReconnection = (reconnectSessionId: string, token: string) => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Exponential backoff for reconnection attempts
    const delay = Math.min(
      1000 * Math.pow(1.5, reconnectAttemptsRef.current),
      30000
    ); // Cap at 30 seconds
    
    setStatus('reconnecting');
    
    reconnectAttemptsRef.current += 1;
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Attempting to reconnect (attempt ${reconnectAttemptsRef.current})...`);
      connect(reconnectSessionId, token);
    }, delay);
  };
  
  // Disconnect from the collaboration session
  const disconnect = () => {
    if (wsRef.current) {
      // Cancel any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close the WebSocket connection
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Disconnected by user');
      }
      
      wsRef.current = null;
      
      // Update state
      setStatus('disconnected');
      setSessionId(undefined);
      setYdoc(undefined);
      setParticipants([]);
    }
  };
  
  // Handle messages from the server
  const handleServerMessage = (message: any) => {
    console.log('Received message from server:', message.type);
    
    switch (message.type) {
      case 'welcome':
        // Just a welcome message, nothing to do
        break;
        
      case 'auth_success':
        // Authentication successful
        setUserId(message.userId);
        setUsername(message.username);
        
        // Join the session after authentication
        if (sessionId) {
          wsRef.current?.send(JSON.stringify({
            type: 'join_session',
            sessionId,
            username: message.username
          }));
        }
        break;
        
      case 'auth_error':
        toast({
          title: "Authentication Error",
          description: message.message || "Failed to authenticate",
          variant: "destructive"
        });
        
        setStatus('error');
        break;
        
      case 'initialState':
        // Session joined, update status
        setStatus('connected');
        
        // Create a new Y.js document
        const newYdoc = new Y.Doc();
        
        // Apply the initial state if available
        if (message.state) {
          try {
            // Decode the base64 state to a Uint8Array
            const state = Uint8Array.from(atob(message.state), c => c.charCodeAt(0));
            Y.applyUpdate(newYdoc, state);
          } catch (error) {
            console.error('Error applying initial state:', error);
          }
        }
        
        // Store the document
        setYdoc(newYdoc);
        
        // Toast notification
        toast({
          title: "Connected",
          description: `Joined collaboration session`,
        });
        break;
        
      case 'clientList':
        // Update the participant list
        setParticipants(message.clients);
        break;
        
      case 'clientJoin':
        // Add the new participant
        setParticipants(current => {
          // Don't add duplicates
          if (current.some(p => p.clientId === message.clientId)) {
            return current;
          }
          
          return [...current, {
            clientId: message.clientId,
            userId: message.userId,
            username: message.username,
            color: message.color
          }];
        });
        
        // Toast notification
        toast({
          title: "Participant Joined",
          description: `${message.username} joined the session`,
        });
        break;
        
      case 'clientLeave':
        // Remove the participant
        setParticipants(current => 
          current.filter(p => p.clientId !== message.clientId)
        );
        break;
        
      case 'yjsUpdate':
        // Apply the update to the Y.js document
        if (ydoc && message.update) {
          try {
            // Decode the base64 update to a Uint8Array
            const update = Uint8Array.from(atob(message.update), c => c.charCodeAt(0));
            Y.applyUpdate(ydoc, update);
          } catch (error) {
            console.error('Error applying update:', error);
          }
        }
        break;
        
      case 'cursorUpdate':
        // Update the participant's cursor position
        setParticipants(current => {
          return current.map(p => {
            if (p.clientId === message.clientId) {
              return {
                ...p,
                position: message.position,
                selection: message.selection
              };
            }
            return p;
          });
        });
        break;
        
      case 'presenceUpdate':
        // Update the participant's presence
        setParticipants(current => {
          return current.map(p => {
            if (p.clientId === message.clientId) {
              return {
                ...p,
                presence: message.presence
              };
            }
            return p;
          });
        });
        break;
        
      case 'error':
        console.error('Error from server:', message.message);
        
        toast({
          title: "Error",
          description: message.message || "An error occurred",
          variant: "destructive"
        });
        break;
        
      default:
        console.warn('Unknown message type from server:', message.type);
    }
  };
  
  // Send a document update to the server
  const sendUpdate = (update: Uint8Array) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Convert the update to base64
      const updateBase64 = btoa(Array.from(update, byte => String.fromCharCode(byte)).join(''));
      
      wsRef.current.send(JSON.stringify({
        type: 'update',
        update: updateBase64
      }));
    }
  };
  
  // Send a cursor position update to the server
  const sendCursorUpdate = (position: any, selection?: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'cursor',
        position,
        selection
      }));
    }
  };
  
  // Send a presence update to the server
  const sendPresenceUpdate = (presence: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'presence',
        state: presence
      }));
    }
  };
  
  // Send a comment to the server
  const sendComment = (comment: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'comment',
        comment
      }));
    }
  };
  
  // Connect automatically if requested
  useEffect(() => {
    if (autoConnect && initialSessionId && initialToken) {
      connect(initialSessionId, initialToken);
    }
    
    // Clean up on unmount
    return () => {
      disconnect();
    };
  }, []); // Empty dependency array to run only once
  
  // Keep WebSocket connection alive with ping/pong
  useEffect(() => {
    let pingInterval: NodeJS.Timeout | null = null;
    
    if (wsRef.current && status === 'connected') {
      pingInterval = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000); // Send ping every 30 seconds
    }
    
    return () => {
      if (pingInterval) {
        clearInterval(pingInterval);
      }
    };
  }, [status]);
  
  // Context value
  const value: CollaborationContextValue = {
    status,
    connect,
    disconnect,
    ydoc,
    participants,
    sessionId,
    userId,
    username,
    sendUpdate,
    sendCursorUpdate,
    sendPresenceUpdate,
    sendComment
  };
  
  // Helper to get status badge styling
  const getStatusBadgeStyling = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'connecting':
      case 'reconnecting':
        return 'bg-blue-100 text-blue-800';
      case 'disconnected':
        return 'bg-slate-100 text-slate-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return '';
    }
  };
  
  // Helper to get status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4 mr-1" />;
      case 'connecting':
      case 'reconnecting':
        return <Clock className="h-4 w-4 mr-1 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="h-4 w-4 mr-1" />;
      case 'error':
        return <X className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };
  
  return (
    <CollaborationContext.Provider value={value}>
      {children}
      
      {showUI && (
        <Card className="fixed bottom-4 right-4 w-64 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Collaboration</span>
              <Badge 
                variant="outline" 
                className={`flex items-center text-xs ${getStatusBadgeStyling()}`}
              >
                {getStatusIcon()}
                {status === 'connected' ? 'Connected' : 
                 status === 'connecting' ? 'Connecting' :
                 status === 'reconnecting' ? 'Reconnecting' :
                 status === 'disconnected' ? 'Disconnected' :
                 'Error'}
              </Badge>
            </CardTitle>
            {sessionId && <CardDescription className="text-xs">Session: {sessionId}</CardDescription>}
          </CardHeader>
          
          <CardContent className="pb-2">
            <div className="space-y-2">
              {participants.length > 0 ? (
                <div className="text-xs">
                  <div className="font-medium mb-1">Participants</div>
                  <div className="flex flex-wrap gap-1">
                    {participants.map(participant => (
                      <TooltipProvider key={participant.clientId}>
                        <Tooltip>
                          <TooltipTrigger>
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                              style={{ backgroundColor: participant.color }}
                            >
                              {participant.username.charAt(0).toUpperCase()}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{participant.username}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              ) : status === 'connected' ? (
                <div className="text-xs text-gray-500 text-center">
                  No other participants
                </div>
              ) : null}
              
              {status === 'error' && (
                <div className="text-xs text-red-500">
                  Connection error. Please try reconnecting.
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="pt-0">
            {status === 'connected' ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs" 
                onClick={disconnect}
              >
                Disconnect
              </Button>
            ) : (
              sessionId && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs" 
                  onClick={() => connect(sessionId, 'demo-token')}
                >
                  {status === 'reconnecting' ? 'Reconnecting...' : 'Reconnect'}
                </Button>
              )
            )}
          </CardFooter>
        </Card>
      )}
    </CollaborationContext.Provider>
  );
};

export default CollaborationProvider;