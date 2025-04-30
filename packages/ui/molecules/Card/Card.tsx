import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { type BaseProps } from '../../types';
import { Text } from '../../atoms/Text';

/**
 * Card variants using class-variance-authority
 */
const cardVariants = cva(
  'rounded-lg border bg-white shadow-sm',
  {
    variants: {
      variant: {
        default: 'border-neutral-200',
        bordered: 'border-neutral-300',
        elevated: 'border-neutral-200 shadow-md',
        flat: 'border-transparent shadow-none',
      },
      padding: {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

export interface CardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants>,
    BaseProps {
  /**
   * Card title
   */
  title?: string;
  
  /**
   * Card description
   */
  description?: string;
  
  /**
   * Custom header content
   */
  header?: React.ReactNode;
  
  /**
   * Custom footer content
   */
  footer?: React.ReactNode;
  
  /**
   * Whether to show a divider between header, content, and footer
   */
  dividers?: boolean;
  
  /**
   * Additional class name
   */
  className?: string;
  
  /**
   * Card content
   */
  children?: React.ReactNode;
}

/**
 * Card component
 * 
 * A versatile card component that can be used to display content in a contained area.
 */
export const Card: React.FC<CardProps> = ({
  title,
  description,
  header,
  footer,
  dividers = false,
  variant,
  padding,
  className,
  children,
  testId,
  ...props
}) => {
  // Determine if we need a header section (either custom header or title/description)
  const hasHeaderContent = !!(header || title || description);
  
  // Determine if we need a footer section
  const hasFooterContent = !!footer;
  
  return (
    <div
      className={cn(cardVariants({ variant, padding: 'none', className }))}
      data-testid={testId}
      {...props}
    >
      {/* Card Header */}
      {hasHeaderContent && (
        <div className={cn(
          'rounded-t-lg',
          padding === 'sm' ? 'p-3' : padding === 'lg' ? 'p-6' : 'p-4',
          dividers && 'border-b border-neutral-200'
        )}>
          {header || (
            <div className="space-y-1">
              {title && <Text variant="h4">{title}</Text>}
              {description && <Text variant="bodySmall" color="muted">{description}</Text>}
            </div>
          )}
        </div>
      )}
      
      {/* Card Content */}
      <div className={cn(
        padding === 'sm' ? 'p-3' : padding === 'lg' ? 'p-6' : 'p-4',
        hasHeaderContent && padding === 'none' && dividers && 'border-t border-neutral-200',
        hasFooterContent && padding === 'none' && dividers && 'border-b border-neutral-200'
      )}>
        {children}
      </div>
      
      {/* Card Footer */}
      {hasFooterContent && (
        <div className={cn(
          'rounded-b-lg',
          padding === 'sm' ? 'p-3' : padding === 'lg' ? 'p-6' : 'p-4',
          dividers && 'border-t border-neutral-200'
        )}>
          {footer}
        </div>
      )}
    </div>
  );
};