import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { type BaseProps } from '../../types';

/**
 * Text variants using class-variance-authority
 */
const textVariants = cva('', {
  variants: {
    variant: {
      h1: 'text-4xl font-bold tracking-tight leading-tight',
      h2: 'text-3xl font-bold tracking-tight leading-tight',
      h3: 'text-2xl font-semibold leading-tight',
      h4: 'text-xl font-semibold leading-tight',
      h5: 'text-lg font-semibold leading-tight',
      h6: 'text-base font-semibold leading-tight',
      body: 'text-base font-normal leading-normal',
      bodyLarge: 'text-lg font-normal leading-normal',
      bodySmall: 'text-sm font-normal leading-normal',
      caption: 'text-xs font-normal leading-tight',
      overline: 'text-xs font-medium leading-none tracking-wider uppercase',
    },
    color: {
      default: 'text-neutral-900',
      muted: 'text-neutral-600',
      primary: 'text-primary-700',
      success: 'text-success-700',
      warning: 'text-warning-700',
      error: 'text-error-700',
      info: 'text-info-700',
      white: 'text-white',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
    truncate: {
      true: 'truncate',
    },
  },
  defaultVariants: {
    variant: 'body',
    color: 'default',
    align: 'left',
    truncate: false,
  },
});

export type TextVariant = 
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' 
  | 'body' | 'bodyLarge' | 'bodySmall' 
  | 'caption' | 'overline';

export type TextColor = 
  | 'default' | 'muted' | 'primary' 
  | 'success' | 'warning' | 'error' 
  | 'info' | 'white';

export type TextAlign = 'left' | 'center' | 'right';

export interface TextProps 
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants>,
    BaseProps {
  variant?: TextVariant;
  color?: TextColor;
  align?: TextAlign;
  truncate?: boolean;
  as?: React.ElementType;
  children?: React.ReactNode;
}

/**
 * Text component
 * 
 * A flexible text component that applies consistent typography styles from our design system.
 */
export const Text: React.FC<TextProps> = ({
  className,
  variant,
  color,
  align,
  truncate,
  as: Comp = 'p',
  testId,
  children,
  ...props
}) => {
  // Map variant to appropriate element if 'as' prop is not provided
  const defaultElementMap: Record<TextVariant, React.ElementType> = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    body: 'p',
    bodyLarge: 'p',
    bodySmall: 'p',
    caption: 'span',
    overline: 'span',
  };

  const Element = Comp || defaultElementMap[variant || 'body'];

  return (
    <Element
      data-testid={testId}
      className={cn(textVariants({ variant, color, align, truncate, className }))}
      {...props}
    >
      {children}
    </Element>
  );
};