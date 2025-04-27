import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { createVariant, cn } from '../../utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = createVariant({
  variant: {
    default:
      'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-1 focus-visible:ring-ring',
    destructive:
      'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-1 focus-visible:ring-destructive',
    outline:
      'border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring',
    secondary:
      'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-1 focus-visible:ring-ring',
    ghost: 'hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring',
    link: 'text-primary underline-offset-4 hover:underline focus-visible:ring-1 focus-visible:ring-ring',
    'tertiary-green': 
      'bg-terrafusion-green-100 text-terrafusion-green-800 hover:bg-terrafusion-green-200 focus-visible:ring-1 focus-visible:ring-terrafusion-green-500',
    'tertiary-blue': 
      'bg-terrafusion-blue-100 text-terrafusion-blue-800 hover:bg-terrafusion-blue-200 focus-visible:ring-1 focus-visible:ring-terrafusion-blue-500', 
    'tertiary-soil': 
      'bg-terrafusion-soil-100 text-terrafusion-soil-800 hover:bg-terrafusion-soil-200 focus-visible:ring-1 focus-visible:ring-terrafusion-soil-500',
  },
  size: {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 rounded-md px-3 text-xs',
    lg: 'h-10 rounded-md px-6',
    icon: 'h-9 w-9 rounded-md',
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * The visual style of the button
   * @default 'default'
   */
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'tertiary-green'
    | 'tertiary-blue'
    | 'tertiary-soil';
  /**
   * The size of the button
   * @default 'default'
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /**
   * Whether to render the component as a different element via Radix Slot
   */
  asChild?: boolean;
  /**
   * Shows a loading spinner and optionally disables the button
   */
  loading?: boolean;
  /**
   * Automatically disable button while loading
   * @default true
   */
  disableWhileLoading?: boolean;
}

/**
 * Primary interaction point for user actions. Supports various
 * visual styles, sizes, and a loading state.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      asChild = false,
      loading = false,
      disableWhileLoading = true,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || (loading && disableWhileLoading);
    
    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
          ...buttonVariants({ variant, size }),
          className
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };