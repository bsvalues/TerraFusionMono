import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { type BaseProps, type Status } from '../../types';
import { Text } from '../../atoms/Text';
import { Button } from '../../atoms/Button';

/**
 * Alert variants using class-variance-authority
 */
const alertVariants = cva(
  'relative w-full rounded-lg border p-4',
  {
    variants: {
      variant: {
        default: 'bg-neutral-50 border-neutral-200 text-neutral-900',
        info: 'bg-info-50 border-info-200 text-info-900',
        success: 'bg-success-50 border-success-200 text-success-900',
        warning: 'bg-warning-50 border-warning-200 text-warning-900',
        error: 'bg-error-50 border-error-200 text-error-900',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface AlertProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants>,
    BaseProps {
  /**
   * Alert title
   */
  title?: string;

  /**
   * Alert description
   */
  description?: React.ReactNode;

  /**
   * The icon to display in the alert
   */
  icon?: React.ReactNode;

  /**
   * Whether the alert is dismissible
   */
  dismissible?: boolean;

  /**
   * Callback for when the alert is dismissed
   */
  onDismiss?: () => void;

  /**
   * Alert variant
   */
  variant?: Status | 'default';

  /**
   * Additional class names for the alert
   */
  className?: string;

  /**
   * Alert content
   */
  children?: React.ReactNode;
}

/**
 * Alert component
 * 
 * A versatile alert component for displaying feedback, notifications, and contextual information.
 */
export const Alert: React.FC<AlertProps> = ({
  title,
  description,
  icon,
  dismissible = false,
  onDismiss,
  variant = 'default',
  className,
  children,
  testId,
  ...props
}) => {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Map the variant to the appropriate status color
  const variantMapping: Record<Status | 'default', 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    default: 'default',
    idle: 'default',
    loading: 'info',
    success: 'success',
    warning: 'warning',
    error: 'error',
  };

  const mappedVariant = variantMapping[variant];

  return (
    <div
      className={cn(alertVariants({ variant: mappedVariant, className }))}
      data-testid={testId}
      {...props}
    >
      {dismissible && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="absolute right-2 top-2"
          aria-label="Dismiss alert"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </Button>
      )}

      <div className={cn("flex", dismissible && "pr-6")}>
        {icon && <div className="mr-3 mt-0.5 flex-shrink-0">{icon}</div>}
        
        <div className="flex-1">
          {title && (
            <Text variant="bodyLarge" className="font-semibold">
              {title}
            </Text>
          )}
          
          {description && (
            <Text variant="body" color="muted" className={title ? 'mt-1' : ''}>
              {description}
            </Text>
          )}
          
          {children && <div className={title || description ? 'mt-3' : ''}>{children}</div>}
        </div>
      </div>
    </div>
  );
};