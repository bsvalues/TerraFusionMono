import React, { useEffect, useRef, useState } from 'react';
import { useCollaboration } from './CollaborationProvider';
import * as Y from 'yjs';

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
    return <div className="error-message">{error}</div>;
  }
  
  return (
    <div className="collaborative-editor">
      <div className="participants">
        <strong>Participants ({participants.length}):</strong>
        <ul>
          {participants.map(participant => (
            <li key={participant.clientId} style={{ color: participant.color }}>
              {participant.username} {participant.presence === 'away' ? '(away)' : ''}
            </li>
          ))}
        </ul>
      </div>
      
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleTextChange}
        onSelect={handleCursorChange}
        onClick={handleCursorChange}
        onKeyUp={handleCursorChange}
        disabled={readOnly || !isJoined}
        className="editor-textarea"
        rows={20}
        placeholder="Start typing..."
      />
      
      {!isJoined && (
        <div className="overlay">
          <div className="message">Connecting to collaboration session...</div>
        </div>
      )}
      
      <style jsx>{`
        .collaborative-editor {
          position: relative;
          border: 1px solid #ccc;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .participants {
          padding: 10px;
          background-color: #f5f5f5;
          border-bottom: 1px solid #ccc;
        }
        
        .participants ul {
          display: flex;
          list-style: none;
          padding: 0;
          margin: 5px 0 0 0;
          flex-wrap: wrap;
        }
        
        .participants li {
          margin-right: 10px;
          font-weight: bold;
        }
        
        .editor-textarea {
          width: 100%;
          padding: 10px;
          font-family: monospace;
          font-size: 14px;
          border: none;
          resize: vertical;
          min-height: 300px;
        }
        
        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .message {
          padding: 20px;
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .error-message {
          color: #d32f2f;
          padding: 10px;
          margin: 10px 0;
          background-color: #ffebee;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default CollaborativeEditor;