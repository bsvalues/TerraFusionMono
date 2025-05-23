import React, { useState, useEffect } from 'react';
import { CollaborationProvider } from '../components/collaboration/CollaborationProvider';
import CollaborativeEditor from '../components/collaboration/CollaborativeEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CollaborationDemo: React.FC = () => {
  const [sessionId, setSessionId] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [userId, setUserId] = useState<number>(1);
  const [token, setToken] = useState<string>('demo-token');
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [existingSessions, setExistingSessions] = useState<any[]>([]);
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Fetch existing collaboration sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/collaboration');
        if (response.ok) {
          const data = await response.json();
          setExistingSessions(data.sessions || []);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };

    fetchSessions();
  }, []);

  // Create a new collaboration session
  const createSession = async () => {
    if (!username) {
      toast({
        title: 'Username required',
        description: 'Please enter a username to create a session',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/collaboration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ownerId: userId,
          documentType: 'text-document',
          documentId: 'demo-' + Date.now(),
          name: `${username}'s Collaboration Session`,
          description: 'A demonstration of real-time collaboration using WebSockets and Y.js',
          permissions: 'public',
          initialState: null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session.sessionId);
        toast({
          title: 'Session created',
          description: `New session created with ID: ${data.session.sessionId}`,
        });
        setIsJoined(true);
      } else {
        const error = await response.json();
        toast({
          title: 'Failed to create session',
          description: error.error || 'Something went wrong',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: 'Error',
        description: 'Failed to create collaboration session',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Join an existing session
  const joinSession = () => {
    if (!sessionId || !username) {
      toast({
        title: 'Information required',
        description: 'Please enter a session ID and username',
        variant: 'destructive'
      });
      return;
    }

    setIsJoined(true);
  };

  // Leave the current session
  const leaveSession = () => {
    setIsJoined(false);
    setSessionId('');
  };

  // Handle content changes
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  return (
    <div className="container max-w-4xl mx-auto my-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">TerraFusion Collaboration Demo</CardTitle>
          <CardDescription>
            Real-time collaborative editing with WebSockets and Y.js
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isJoined ? (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Join or Create a Session</h3>
                
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    Your Username
                  </label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="sessionId" className="text-sm font-medium">
                    Session ID
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      id="sessionId"
                      value={sessionId}
                      onChange={(e) => setSessionId(e.target.value)}
                      placeholder="Enter session ID to join"
                    />
                    <Button 
                      onClick={joinSession} 
                      disabled={!sessionId || !username}
                    >
                      Join
                    </Button>
                  </div>
                </div>
                
                <div className="text-center">
                  <span className="text-sm text-gray-500">or</span>
                </div>
                
                <Button 
                  onClick={createSession} 
                  className="w-full" 
                  variant="outline" 
                  disabled={!username || isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create New Session'}
                </Button>
              </div>
              
              {existingSessions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Existing Sessions</h3>
                  <div className="space-y-2">
                    {existingSessions.map((session) => (
                      <div 
                        key={session.sessionId} 
                        className="flex items-center justify-between p-3 border rounded-md"
                        onClick={() => setSessionId(session.sessionId)}
                      >
                        <div>
                          <p className="font-medium">{session.name}</p>
                          <p className="text-sm text-gray-500">
                            {session.description || 'No description'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                            {session.status}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSessionId(session.sessionId);
                            }}
                          >
                            Select
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <CollaborationProvider>
              {({ 
                connectToSession, 
                disconnectFromSession, 
                isConnected, 
                isJoined, 
                error, 
                participants 
              }) => (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium">Session: {sessionId}</h3>
                        <Badge variant={
                          isJoined ? "success" : 
                          isConnected ? "outline" : 
                          "secondary"
                        }>
                          {isJoined ? 'Active' : isConnected ? 'Connected' : 'Connecting...'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-500">
                        Connected as: {username}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Status:</span> {
                            isJoined ? 'Collaborating' : 
                            isConnected ? 'Connected (not joined)' : 
                            'Establishing connection...'
                          }
                        </p>
                        
                        {!isConnected && (
                          <Badge variant="outline" className="animate-pulse">
                            Reconnecting...
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          disconnectFromSession();
                          leaveSession();
                        }}
                      >
                        Leave Session
                      </Button>
                      
                      {isConnected && !isJoined && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => connectToSession(sessionId, token, userId, username)}
                        >
                          Join
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {error && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertDescription className="text-xs">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {isConnected && !isJoined && (
                    <Card className="bg-muted/50 p-6 text-center">
                      <h3 className="font-medium mb-2">Ready to Collaborate</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        You're connected to the session but haven't joined the collaboration yet.
                      </p>
                      <Button 
                        onClick={() => connectToSession(sessionId, token, userId, username)}
                        className="w-full"
                      >
                        Join Collaboration
                      </Button>
                    </Card>
                  )}
                  
                  {isJoined && (
                    <CollaborativeEditor
                      initialContent="Start typing here to collaborate in real-time!"
                      onContentChange={handleContentChange}
                    />
                  )}
                  
                  {participants.length > 0 && (
                    <Card className="mt-4 p-4">
                      <h4 className="text-sm font-medium mb-2">Active Participants ({participants.length})</h4>
                      <div className="flex flex-wrap gap-2">
                        {participants.map(participant => (
                          <Badge 
                            key={participant.clientId}
                            variant="outline"
                            className="text-xs"
                            style={{ 
                              backgroundColor: `${participant.color}20`, 
                              borderColor: participant.color,
                              color: participant.color
                            }}
                          >
                            {participant.username}
                            {participant.presence === 'away' ? ' (away)' : ''}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  )}
                  
                  {!isConnected && (
                    <Card className="bg-secondary/20 p-4 border-dashed">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <div>
                          <h4 className="text-sm font-medium">Connection Status</h4>
                          <p className="text-xs text-muted-foreground">
                            Attempting to establish a WebSocket connection. This may take a moment...
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </CollaborationProvider>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-2">
          <p className="text-sm text-gray-500">
            Share the session ID with others to collaborate in real-time.
          </p>
          <p className="text-sm text-gray-500">
            This demo showcases TerraFusion's WebSocket collaboration system with Y.js integration.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CollaborationDemo;