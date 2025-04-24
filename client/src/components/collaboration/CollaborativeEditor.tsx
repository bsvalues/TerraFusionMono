import React, { useEffect, useRef, useState } from 'react';
import { useCollaboration } from './CollaborationProvider';
import * as Y from 'yjs';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface CollaborativeEditorProps {
  initialContent?: string;
  readOnly?: boolean;
  onContentChange?: (content: string) => void;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  initialContent = '',
  readOnly = false,
  onContentChange
}) => {
  const {
    isJoined,
    error,
    participants,
    sendUpdate,
    updateCursor,
    getYDoc
  } = useCollaboration();
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const yTextRef = useRef<Y.Text | null>(null);
  const [content, setContent] = useState(initialContent);
  const isTypingRef = useRef(false);
  
  // Initialize Y.Text and bind it to the textarea
  useEffect(() => {
    if (!isJoined) return;
    
    const ydoc = getYDoc();
    if (!ydoc) return;
    
    // Get or create the shared text
    const ytext = ydoc.getText('content');
    yTextRef.current = ytext;
    
    // Initialize with content if needed
    if (ytext.length === 0 && initialContent) {
      ytext.insert(0, initialContent);
    }
    
    // Set initial content
    setContent(ytext.toString());
    
    // Listen for updates to the shared text
    const observer = (event: Y.YTextEvent) => {
      if (isTypingRef.current) return;
      
      // Update the content
      setContent(ytext.toString());
      
      // Call onContentChange handler
      if (onContentChange) {
        onContentChange(ytext.toString());
      }
    };
    
    ytext.observe(observer);
    
    // Clean up
    return () => {
      ytext.unobserve(observer);
    };
  }, [isJoined, initialContent, onContentChange, getYDoc]);
  
  // Handle text changes
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    
    const newContent = e.target.value;
    
    // Get cursor position
    const selectionStart = e.target.selectionStart;
    const selectionEnd = e.target.selectionEnd;
    
    // Update local state
    setContent(newContent);
    
    // Apply changes to Y.Text
    const ytext = yTextRef.current;
    const ydoc = getYDoc();
    
    if (ytext && ydoc) {
      // Prevent observer from updating
      isTypingRef.current = true;
      
      // Create a transaction to batch changes
      ydoc.transact(() => {
        // Replace the entire content
        // This is simplistic - a real implementation would do diffing
        ytext.delete(0, ytext.length);
        ytext.insert(0, newContent);
      });
      
      // Send update to other clients
      const update = Y.encodeStateAsUpdate(ydoc);
      sendUpdate(update);
      
      // Enable observer
      isTypingRef.current = false;
      
      // Update cursor position
      if (textareaRef.current) {
        textareaRef.current.selectionStart = selectionStart;
        textareaRef.current.selectionEnd = selectionEnd;
      }
      
      // Call onContentChange handler
      if (onContentChange) {
        onContentChange(newContent);
      }
    }
  };
  
  // Update cursor position
  const handleCursorChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    
    const textarea = e.target as HTMLTextAreaElement;
    const { selectionStart, selectionEnd } = textarea;
    
    // Get position in the viewport
    const rect = textarea.getBoundingClientRect();
    
    // Calculate cursor coordinates
    const position = {
      x: rect.left,
      y: rect.top
    };
    
    // Send cursor update
    updateCursor(position, {
      anchor: selectionStart,
      head: selectionEnd
    });
  };
  
  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Card className="collaborative-editor relative overflow-hidden">
      <CardHeader className="bg-secondary/20 pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Collaborative Document</span>
          <span className="text-xs text-muted-foreground">
            {participants.length} active participant{participants.length !== 1 ? 's' : ''}
          </span>
        </CardTitle>
        {participants.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {participants.map(participant => (
              <Badge 
                key={participant.clientId}
                variant="outline"
                className="text-xs font-normal"
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
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          onSelect={handleCursorChange}
          onClick={handleCursorChange}
          onKeyUp={handleCursorChange}
          disabled={readOnly || !isJoined}
          className="min-h-[350px] rounded-none border-0 border-t resize-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono"
          placeholder="Start typing to collaborate in real-time..."
        />
      </CardContent>
      
      {!isJoined && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 p-4 bg-card rounded-md shadow-md">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm font-medium">Connecting to collaboration session...</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CollaborativeEditor;