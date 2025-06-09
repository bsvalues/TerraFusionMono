import React from 'react';
import { cn } from '../../utils/cn';
import { type BaseProps } from '../../types';

export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends BaseProps {
  /**
   * The content of the badge
   */
  children: React.ReactNode;
  
  /**
   * The visual style of the badge
   */
  variant?: BadgeVariant;
  
  /**
   * The size of the badge
   */
  size?: BadgeSize;
  
  /**
   * Whether the badge is outlined
   */
  outlined?: boolean;
  
  /**
   * Additional CSS class for the badge
   */
  className?: string;
}

/**
 * Badge atom component
 * 
 * Used to highlight or label content with a colored marker
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  outlined = false,
  className,
  testId,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium',
        // Size variations
        {
          'px-2 py-0.5 text-xs': size === 'sm',
          'px-2.5 py-0.5 text-sm': size === 'md',
          'px-3 py-1 text-base': size === 'lg',
        },
        // Solid variants
        !outlined && {
          'bg-neutral-100 text-neutral-800': variant === 'default',
          'bg-primary-100 text-primary-800': variant === 'primary',
          'bg-secondary-100 text-secondary-800': variant === 'secondary',
          'bg-success-100 text-success-800': variant === 'success',
          'bg-warning-100 text-warning-800': variant === 'warning',
          'bg-error-100 text-error-800': variant === 'error',
          'bg-info-100 text-info-800': variant === 'info',
        },
        // Outlined variants
        outlined && {
          'border bg-transparent': true,
          'border-neutral-200 text-neutral-800': variant === 'default',
          'border-primary-200 text-primary-800': variant === 'primary',
          'border-secondary-200 text-secondary-800': variant === 'secondary',
          'border-success-200 text-success-800': variant === 'success',
          'border-warning-200 text-warning-800': variant === 'warning',
          'border-error-200 text-error-800': variant === 'error',
          'border-info-200 text-info-800': variant === 'info',
        },
        className
      )}
      data-testid={testId}
    >
      {children}
    </span>
  );
};