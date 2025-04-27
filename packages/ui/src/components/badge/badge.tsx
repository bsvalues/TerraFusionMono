import * as React from 'react';
import { createVariant, cn } from '../../utils';

const badgeVariants = createVariant({
  variant: {
    default: 'bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground border border-input hover:bg-accent hover:text-accent-foreground',
    'green-subtle': 'bg-terrafusion-green-100 text-terrafusion-green-800 hover:bg-terrafusion-green-200',
    'blue-subtle': 'bg-terrafusion-blue-100 text-terrafusion-blue-800 hover:bg-terrafusion-blue-200', 
    'soil-subtle': 'bg-terrafusion-soil-100 text-terrafusion-soil-800 hover:bg-terrafusion-soil-200',
  },
  size: {
    default: 'h-6 px-2.5 py-0.5 text-xs',
    sm: 'h-5 px-1.5 py-0 text-xs',
    lg: 'h-7 px-3 py-1 text-sm',
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The visual style of the badge
   * @default 'default'
   */
  variant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'green-subtle'
    | 'blue-subtle'
    | 'soil-subtle';
  /**
   * The size of the badge
   * @default 'default'
   */
  size?: 'default' | 'sm' | 'lg';
}

/**
 * Badge component for displaying labels, statuses, and counts.
 */
export function Badge({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        ...badgeVariants({ variant, size }),
        className
      )}
      {...props}
    />
  );
}