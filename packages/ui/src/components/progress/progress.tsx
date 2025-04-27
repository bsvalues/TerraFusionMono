import * as React from 'react';
import { cn } from '../../utils';

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The value of the progress indicator (0-100)
   */
  value?: number;
  /**
   * Maximum value, typically 100
   */
  max?: number;
  /**
   * Whether to show the progress indicator
   */
  showValue?: boolean;
  /**
   * Color variant of the progress indicator
   */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  /**
   * Animated stripes for in-progress indicators
   */
  striped?: boolean;
  /**
   * Animate the stripes (requires striped to be true)
   */
  animated?: boolean;
}

/**
 * Progress indicator for displaying completion percentage
 * of an operation or task.
 */
export function Progress({
  className,
  value = 0,
  max = 100,
  showValue = false,
  variant = 'default',
  striped = false,
  animated = false,
  ...props
}: ProgressProps) {
  // Ensure value is between 0 and max
  const clampedValue = Math.max(0, Math.min(value, max));
  
  // Calculate percentage
  const percentage = (clampedValue / max) * 100;
  
  // Get appropriate colors based on variant
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'bg-terrafusion-green-500';
      case 'warning':
        return 'bg-terrafusion-soil-500';
      case 'error':
        return 'bg-destructive';
      case 'info':
        return 'bg-terrafusion-blue-500';
      default:
        return 'bg-primary';
    }
  };
  
  return (
    <div
      className={cn(
        'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'h-full w-full flex-1 transition-all',
          getVariantClasses(),
          striped && 'bg-[length:1rem_1rem] bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)]',
          animated && striped && 'animate-progress-stripes'
        )}
        style={{ width: `${percentage}%` }}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        {showValue && (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    </div>
  );
}