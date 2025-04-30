import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { type Size, type BaseProps } from '../../types';

/**
 * Input variants using class-variance-authority
 */
const inputVariants = cva(
  'flex w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        xs: 'h-7 px-2 text-xs',
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-3 py-2',
        lg: 'h-12 px-4 py-3 text-base',
        xl: 'h-14 px-4 py-3 text-lg',
      },
      error: {
        true: 'border-error-500 focus-visible:ring-error-600',
      },
    },
    defaultVariants: {
      size: 'md',
      error: false,
    },
  }
);

export interface InputProps 
  extends React.InputHTMLAttributes<HTMLInputElement>,
    Omit<VariantProps<typeof inputVariants>, 'error'>,
    BaseProps {
  size?: Size;
  error?: boolean;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Input component
 * 
 * A versatile input component that supports various sizes and states.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    size, 
    error = false, 
    errorMessage,
    leftIcon,
    rightIcon,
    testId,
    ...props 
  }, ref) => {
    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          data-testid={testId}
          className={cn(
            inputVariants({ size, error, className }),
            leftIcon && 'pl-10',
            rightIcon && 'pr-10'
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
            {rightIcon}
          </div>
        )}
        {error && errorMessage && (
          <p className="mt-1 text-xs text-error-600">{errorMessage}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';