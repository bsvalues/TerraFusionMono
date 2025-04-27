import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { createVariant, cn } from '../../utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = createVariant({
  variant: {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 hover:underline',
    'terrafusion-green': 'bg-terrafusion-green-600 text-white hover:bg-terrafusion-green-700',
    'terrafusion-blue': 'bg-terrafusion-blue-600 text-white hover:bg-terrafusion-blue-700',
    'terrafusion-soil': 'bg-terrafusion-soil-600 text-white hover:bg-terrafusion-soil-700',
  },
  size: {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 px-3 text-sm',
    lg: 'h-11 px-8 text-lg',
    icon: 'h-10 w-10',
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
    | 'terrafusion-green'
    | 'terrafusion-blue'
    | 'terrafusion-soil';
  /**
   * The size of the button
   * @default 'default'
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /**
   * Whether the button should render as a child component
   * This passes the button styles to the child instead
   * @default false
   */
  asChild?: boolean;
  /**
   * Show a loading spinner and disable the button
   * @default false
   */
  loading?: boolean;
  /**
   * Icon to display alongside button text
   */
  icon?: React.ReactNode;
  /**
   * Position of the icon
   * @default 'left'
   */
  iconPosition?: 'left' | 'right';
  /**
   * Display as full width button
   * @default false
   */
  fullWidth?: boolean;
}

/**
 * Button component with various styles and states.
 * Used for primary actions and interactive elements.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'default', 
    asChild = false, 
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    disabled, 
    children,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;
    
    // Show loading spinner in place of the icon when loading
    const renderedIcon = loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon;
    
    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          ...buttonVariants({ variant, size }),
          fullWidth && 'w-full',
          className
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {renderedIcon && iconPosition === 'left' && (
          <span className={cn("mr-2", !children && "mr-0")}>{renderedIcon}</span>
        )}
        
        {children}
        
        {renderedIcon && iconPosition === 'right' && (
          <span className={cn("ml-2", !children && "ml-0")}>{renderedIcon}</span>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };