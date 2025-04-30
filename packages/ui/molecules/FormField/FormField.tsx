import React from 'react';
import { Input, type InputProps } from '../../atoms/Input';
import { Text } from '../../atoms/Text';
import { cn } from '../../utils/cn';
import { type BaseProps } from '../../types';

export interface FormFieldProps extends BaseProps {
  /**
   * Field label
   */
  label: string;
  
  /**
   * Input props
   */
  inputProps: InputProps;
  
  /**
   * Whether the field is required
   */
  required?: boolean;
  
  /**
   * Hint text displayed below the input
   */
  hint?: string;
  
  /**
   * Error message
   */
  error?: string;
  
  /**
   * Additional class name
   */
  className?: string;
  
  /**
   * ID for the input
   */
  id?: string;
}

/**
 * FormField component
 * 
 * A molecule component that combines a label, input, and error/hint text
 * for a complete form field implementation.
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  inputProps,
  required = false,
  hint,
  error,
  className,
  id,
  testId,
}) => {
  // Generate a unique ID if none is provided
  const fieldId = id || `field-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <div className={cn('mb-4', className)} data-testid={testId}>
      <div className="mb-1 flex items-baseline justify-between">
        <Text
          as="label"
          htmlFor={fieldId}
          variant="bodySmall"
          color="default"
          className="font-medium"
        >
          {label}
          {required && <span className="ml-1 text-error-600">*</span>}
        </Text>
      </div>
      
      <Input
        id={fieldId}
        error={!!error}
        errorMessage={error}
        {...inputProps}
      />
      
      {!error && hint && (
        <Text variant="caption" color="muted" className="mt-1">
          {hint}
        </Text>
      )}
    </div>
  );
};