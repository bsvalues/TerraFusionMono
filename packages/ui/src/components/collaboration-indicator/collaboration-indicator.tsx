import * as React from 'react';
import { cn } from '../../utils';
import { 
  Users,
  Loader2,
  SignalHigh,
  SignalMedium,
  SignalLow,
  UserX,
  User,
  AlertCircle,
  UserCheck,
  DotIcon
} from 'lucide-react';
import { Badge } from '../badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../tooltip';

export type CollaborationStatus = 
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

export interface Collaborator {
  id: string;
  name: string;
  color?: string;
  avatarUrl?: string;
  isActive?: boolean;
  lastActive?: Date;
}

export interface CollaborationIndicatorProps {
  /**
   * Connection status
   */
  status: CollaborationStatus;
  /**
   * List of collaborators
   */
  collaborators?: Collaborator[];
  /**
   * Error message when status is 'error'
   */
  errorMessage?: string;
  /**
   * Field/document identifier
   */
  documentId?: string;
  /**
   * Whether to show the collaborator count
   */
  showCount?: boolean;
  /**
   * Maximum number of collaborator avatars to show
   */
  maxAvatars?: number;
  /**
   * Whether clicking the indicator should trigger the onTogglePanel callback
   */
  clickable?: boolean;
  /**
   * Whether the collaborator panel is open
   */
  isPanelOpen?: boolean;
  /**
   * Callback when the indicator is clicked
   */
  onTogglePanel?: () => void;
  /**
   * Additional CSS class names
   */
  className?: string;
  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Indicator for real-time collaboration status and active collaborators
 */
export const CollaborationIndicator = ({
  status,
  collaborators = [],
  errorMessage,
  documentId,
  showCount = true,
  maxAvatars = 3,
  clickable = true,
  isPanelOpen = false,
  onTogglePanel,
  className = '',
  size = 'md'
}: CollaborationIndicatorProps) => {
  // Calculate number of active users
  const activeCollaborators = collaborators.filter(c => c.isActive);
  const activeCount = activeCollaborators.length;
  
  // Get status details
  const getStatusDetails = () => {
    // Icon size based on component size
    const iconSize = cn(
      size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
    );
    
    switch (status) {
      case 'connected':
        return {
          icon: <SignalHigh className={cn("text-terrafusion-green-500", iconSize)} />,
          label: 'Connected',
          color: 'bg-terrafusion-green-500',
          textColor: 'text-terrafusion-green-700',
          bgColor: 'bg-terrafusion-green-50 border-terrafusion-green-200',
        };
      case 'connecting':
        return {
          icon: <Loader2 className={cn("text-terrafusion-blue-500 animate-spin", iconSize)} />,
          label: 'Connecting',
          color: 'bg-terrafusion-blue-400',
          textColor: 'text-terrafusion-blue-700',
          bgColor: 'bg-terrafusion-blue-50 border-terrafusion-blue-200',
        };
      case 'reconnecting':
        return {
          icon: <Loader2 className={cn("text-terrafusion-soil-500 animate-spin", iconSize)} />,
          label: 'Reconnecting',
          color: 'bg-terrafusion-soil-400',
          textColor: 'text-terrafusion-soil-700',
          bgColor: 'bg-terrafusion-soil-50 border-terrafusion-soil-200',
        };
      case 'disconnected':
        return {
          icon: <SignalLow className={cn("text-slate-500", iconSize)} />,
          label: 'Offline',
          color: 'bg-slate-400',
          textColor: 'text-slate-700',
          bgColor: 'bg-slate-50 border-slate-200',
        };
      case 'error':
        return {
          icon: <AlertCircle className={cn("text-destructive", iconSize)} />,
          label: 'Error',
          color: 'bg-destructive',
          textColor: 'text-destructive',
          bgColor: 'bg-destructive/10 border-destructive/20',
        };
      default:
        return {
          icon: <SignalLow className={cn("text-slate-400", iconSize)} />,
          label: 'Unknown',
          color: 'bg-slate-300',
          textColor: 'text-slate-700',
          bgColor: 'bg-slate-50 border-slate-200',
        };
    }
  };
  
  // Format timestamp
  const formatTime = (date?: Date) => {
    if (!date) return '';
    
    // If less than a day ago, show relative time
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 1000 * 60) {
      return 'Just now';
    }
    if (diff < 1000 * 60 * 60) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    }
    if (diff < 1000 * 60 * 60 * 24) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      return `${hours}h ago`;
    }
    
    // Otherwise show date
    return date.toLocaleDateString();
  };
  
  // Generate avatar based on collaborator
  const getAvatar = (collaborator: Collaborator, index: number) => {
    // Use avatar URL if provided
    if (collaborator.avatarUrl) {
      return (
        <img 
          src={collaborator.avatarUrl} 
          alt={collaborator.name} 
          className="h-full w-full object-cover rounded-full"
        />
      );
    }
    
    // Otherwise use initial and background color
    return (
      <div 
        className="h-full w-full flex items-center justify-center rounded-full text-white text-xs font-medium"
        style={{ 
          backgroundColor: collaborator.color || `hsl(${(index * 55) % 360}, 70%, 45%)`
        }}
      >
        {collaborator.name.charAt(0).toUpperCase()}
      </div>
    );
  };
  
  const statusDetails = getStatusDetails();
  
  const containerClasses = cn(
    "rounded-md border flex items-center gap-1 transition-all",
    statusDetails.bgColor,
    size === 'sm' ? 'px-1.5 py-1 text-xs' : size === 'lg' ? 'px-3 py-2 text-sm' : 'px-2 py-1.5 text-xs',
    clickable && "cursor-pointer hover:shadow-sm",
    className
  );
  
  const content = (
    <>
      {statusDetails.icon}
      
      {size !== 'sm' && (
        <span className={cn("font-medium", statusDetails.textColor)}>
          {status === 'error' ? 'Connection Error' : statusDetails.label}
        </span>
      )}
      
      {showCount && activeCount > 0 && (
        <Badge 
          variant="default" 
          className={cn(
            "ml-1 text-[10px] font-normal", 
            size === 'sm' ? 'h-4 px-1' : 'h-5 px-1.5',
            activeCount > 0 ? "bg-green-subtle" : "bg-slate-400"
          )}
        >
          {activeCount}
        </Badge>
      )}
      
      {size !== 'sm' && collaborators.length > 0 && (
        <div className="flex -space-x-2 ml-1.5 overflow-hidden">
          {activeCollaborators.slice(0, maxAvatars).map((collaborator, index) => (
            <div 
              key={collaborator.id} 
              className={cn(
                "border-2 border-white rounded-full overflow-hidden",
                size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
              )}
            >
              {getAvatar(collaborator, index)}
            </div>
          ))}
          
          {activeCount > maxAvatars && (
            <div 
              className={cn(
                "flex items-center justify-center text-xs font-medium text-slate-600 bg-slate-100 border-2 border-white rounded-full",
                size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
              )}
            >
              +{activeCount - maxAvatars}
            </div>
          )}
        </div>
      )}
    </>
  );
  
  // If there's an error or extra info to show, wrap in a tooltip
  if (errorMessage || (isPanelOpen && clickable)) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={cn(containerClasses, isPanelOpen && "ring-2 ring-terrafusion-blue-200")}
              onClick={clickable ? onTogglePanel : undefined}
            >
              {content}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {status === 'error' ? (
              <div>
                <p className="font-medium text-destructive">Connection Error</p>
                {errorMessage && <p className="text-xs mt-1">{errorMessage}</p>}
                <p className="text-xs mt-1">Click to retry connection</p>
              </div>
            ) : (
              <div>
                <p className="font-medium">{statusDetails.label}</p>
                {documentId && <p className="text-xs mt-1">Document: {documentId}</p>}
                {activeCount > 0 ? (
                  <p className="text-xs mt-1">{activeCount} active collaborator{activeCount !== 1 ? 's' : ''}</p>
                ) : (
                  <p className="text-xs mt-1">No active collaborators</p>
                )}
                {clickable && (
                  <p className="text-xs mt-1">Click to {isPanelOpen ? 'hide' : 'show'} collaborators</p>
                )}
              </div>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Otherwise just return the indicator
  return (
    <div 
      className={containerClasses}
      onClick={clickable ? onTogglePanel : undefined}
    >
      {content}
    </div>
  );
};