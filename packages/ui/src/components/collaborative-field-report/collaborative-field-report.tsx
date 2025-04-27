import * as React from 'react';
import { cn } from '../../utils';
import { FieldReport, type FieldReportProps } from '../field-report';
import { CollaborationIndicator, type CollaborationStatus, type Collaborator } from '../collaboration-indicator';

export interface CollaborationComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
  position?: { x: number, y: number } | null;
  resolved?: boolean;
}

export interface CollaborativeFieldReportProps extends Omit<FieldReportProps, 'onShare'> {
  /**
   * Collaboration status
   */
  collaborationStatus: CollaborationStatus;
  /**
   * List of collaborators
   */
  collaborators?: Collaborator[];
  /**
   * Whether the collaboration panel is open
   */
  isPanelOpen?: boolean;
  /**
   * Collaboration session ID
   */
  sessionId?: string;
  /**
   * Comments on the field report
   */
  comments?: CollaborationComment[];
  /**
   * Current user ID
   */
  currentUserId?: string;
  /**
   * Current user name
   */
  currentUserName?: string;
  /**
   * Callback for toggling the collaboration panel
   */
  onTogglePanel?: () => void;
  /**
   * Callback for sharing the field report
   */
  onShare?: (collaborators?: string[]) => void;
  /**
   * Callback for adding a comment
   */
  onAddComment?: (text: string, position?: { x: number, y: number } | null) => void;
  /**
   * Callback for resolving a comment
   */
  onResolveComment?: (commentId: string) => void;
  /**
   * Callback for when a connection error occurs
   */
  onConnectionError?: (error: Error) => void;
  /**
   * Error message
   */
  errorMessage?: string;
}

/**
 * CollaborativeFieldReport component for displaying and collaborating on field reports
 */
export const CollaborativeFieldReport = ({
  // Collaboration-specific props
  collaborationStatus,
  collaborators = [],
  isPanelOpen = false,
  sessionId,
  comments = [],
  currentUserId,
  currentUserName,
  onTogglePanel,
  onShare,
  onAddComment,
  onResolveComment,
  onConnectionError,
  errorMessage,
  
  // Pass-through field report props
  className = '',
  ...fieldReportProps
}: CollaborativeFieldReportProps) => {
  // State for the comment being composed
  const [newComment, setNewComment] = React.useState('');
  const [commentPosition, setCommentPosition] = React.useState<{ x: number, y: number } | null>(null);
  const [isAddingComment, setIsAddingComment] = React.useState(false);
  
  // Ref to the field report element for positioning comments
  const fieldReportRef = React.useRef<HTMLDivElement>(null);
  
  // Handle clicks on the field report for adding comments
  const handleFieldReportClick = (e: React.MouseEvent) => {
    if (!isAddingComment || !fieldReportRef.current) return;
    
    // Calculate relative position
    const rect = fieldReportRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setCommentPosition({ x, y });
  };
  
  // Handle comment submission
  const handleSubmitComment = () => {
    if (!newComment.trim() || !onAddComment) return;
    
    onAddComment(newComment, commentPosition);
    setNewComment('');
    setCommentPosition(null);
    setIsAddingComment(false);
  };
  
  // Handle pressing escape to cancel comment
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAddingComment) {
        setIsAddingComment(false);
        setCommentPosition(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddingComment]);
  
  // Handle share button click
  const handleShare = () => {
    if (onShare) {
      onShare(collaborators.map(c => c.id));
    }
  };
  
  return (
    <div className={cn("relative", className)}>
      {/* Field Report Component */}
      <div
        ref={fieldReportRef}
        className={cn("relative", isAddingComment && "cursor-crosshair")}
        onClick={handleFieldReportClick}
      >
        <FieldReport
          {...fieldReportProps}
          onShare={handleShare}
        />
        
        {/* Comment Markers */}
        {comments.map(comment => !comment.resolved && comment.position && (
          <div
            key={comment.id}
            className="absolute w-6 h-6 bg-terrafusion-blue-500 rounded-full flex items-center justify-center text-white font-medium text-xs -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-md cursor-pointer hover:bg-terrafusion-blue-600 transition-colors"
            style={{
              left: `${comment.position.x}%`,
              top: `${comment.position.y}%`,
              zIndex: 10
            }}
            onClick={(e) => {
              e.stopPropagation();
              // Logic to show comment detail
            }}
          >
            {comment.userName.charAt(0).toUpperCase()}
          </div>
        ))}
        
        {/* New Comment Marker */}
        {isAddingComment && commentPosition && (
          <div
            className="absolute w-6 h-6 bg-terrafusion-green-500 rounded-full flex items-center justify-center text-white font-medium text-xs -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-md animate-pulse"
            style={{
              left: `${commentPosition.x}%`,
              top: `${commentPosition.y}%`,
              zIndex: 10
            }}
          >
            +
          </div>
        )}
      </div>
      
      {/* Collaboration Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* New Comment Button */}
        <button
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md border shadow-sm transition-colors",
            isAddingComment 
              ? "bg-terrafusion-green-500 text-white border-terrafusion-green-600"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          )}
          onClick={() => {
            setIsAddingComment(!isAddingComment);
            if (!isAddingComment) {
              setCommentPosition(null);
            }
          }}
        >
          {isAddingComment ? 'Cancel' : 'Add Comment'}
        </button>
        
        {/* Collaboration Indicator */}
        <CollaborationIndicator
          status={collaborationStatus}
          collaborators={collaborators}
          documentId={sessionId}
          errorMessage={errorMessage}
          clickable={true}
          isPanelOpen={isPanelOpen}
          onTogglePanel={onTogglePanel}
        />
      </div>
      
      {/* New Comment Form */}
      {isAddingComment && commentPosition && (
        <div
          className="absolute z-20 w-64 bg-white rounded-md shadow-lg border p-3"
          style={{
            left: `${commentPosition.x}%`,
            top: `${commentPosition.y + 3}%`,
            transform: 'translateX(-50%)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-sm font-medium mb-2">New Comment</div>
          <textarea
            className="w-full p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-terrafusion-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Type your comment here..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end mt-2 gap-2">
            <button
              className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              onClick={() => {
                setIsAddingComment(false);
                setCommentPosition(null);
              }}
            >
              Cancel
            </button>
            <button
              className={cn(
                "px-3 py-1 text-xs text-white rounded-md transition-colors",
                newComment.trim()
                  ? "bg-terrafusion-blue-500 hover:bg-terrafusion-blue-600"
                  : "bg-slate-300 cursor-not-allowed"
              )}
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
            >
              Submit
            </button>
          </div>
        </div>
      )}
      
      {/* Comments Panel (visible when isPanelOpen is true) */}
      {isPanelOpen && (
        <div className="absolute top-0 right-0 h-full w-80 bg-white shadow-lg border-l border-t border-b rounded-l-lg z-10 flex flex-col">
          <div className="p-3 border-b bg-slate-50 rounded-tl-lg">
            <div className="text-sm font-medium">Comments & Collaboration</div>
            <div className="text-xs text-slate-500">
              {collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="p-3 border-b">
            <div className="text-xs font-medium mb-2">Active Collaborators</div>
            <div className="space-y-2">
              {collaborators.length > 0 ? (
                collaborators.map(collaborator => (
                  <div key={collaborator.id} className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                      style={{
                        backgroundColor: collaborator.color || '#6366F1'
                      }}
                    >
                      {collaborator.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-sm">{collaborator.name}</div>
                    {collaborator.isActive && (
                      <div className="w-2 h-2 bg-green-500 rounded-full ml-auto"></div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500">No active collaborators</div>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3">
            <div className="text-xs font-medium mb-2">Comments</div>
            <div className="space-y-3">
              {comments.length > 0 ? (
                comments.map(comment => (
                  <div 
                    key={comment.id} 
                    className={cn(
                      "p-2 rounded-md text-sm", 
                      comment.resolved 
                        ? "bg-slate-100 text-slate-500" 
                        : "bg-terrafusion-blue-50 border border-terrafusion-blue-100"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium">{comment.userName}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(comment.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                    <div className="text-xs mb-1">{comment.text}</div>
                    {!comment.resolved && (
                      <button
                        className="text-xs text-terrafusion-blue-500 hover:underline mt-1"
                        onClick={() => onResolveComment && onResolveComment(comment.id)}
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500">No comments yet</div>
              )}
            </div>
          </div>
          
          <div className="p-3 border-t mt-auto">
            <button
              className="w-full px-3 py-1.5 text-xs font-medium rounded-md border shadow-sm transition-colors bg-terrafusion-green-500 text-white border-terrafusion-green-600 hover:bg-terrafusion-green-600"
              onClick={() => {
                setIsAddingComment(true);
                onTogglePanel && onTogglePanel();
              }}
            >
              Add Comment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};