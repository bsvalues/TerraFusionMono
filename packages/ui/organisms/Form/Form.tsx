import React from 'react';
import { cn } from '../../utils/cn';
import { FormField } from '../../molecules/FormField';
import { Button } from '../../atoms/Button';
import { Alert } from '../../molecules/Alert';
import { type BaseProps } from '../../types';

export interface FormProps extends BaseProps {
  /**
   * The form's child elements
   */
  children: React.ReactNode;
  
  /**
   * Form submission handler
   */
  onSubmit: (e: React.FormEvent) => void;
  
  /**
   * Whether the form is currently submitting
   */
  isSubmitting?: boolean;
  
  /**
   * Text for the submit button
   */
  submitText?: string;
  
  /**
   * Whether to disable the submit button
   */
  isDisabled?: boolean;
  
  /**
   * Text for the cancel button, if any
   */
  cancelText?: string;
  
  /**
   * Handler for the cancel button
   */
  onCancel?: () => void;
  
  /**
   * Error message to display
   */
  error?: string;
  
  /**
   * Success message to display
   */
  success?: string;
  
  /**
   * Additional classes for the form
   */
  className?: string;
  
  /**
   * Additional classes for the form actions
   */
  actionsClassName?: string;
}

/**
 * Form organism component
 * 
 * A complete form component that includes form fields, buttons, and status messages.
 */
export const Form: React.FC<FormProps> = ({
  children,
  onSubmit,
  isSubmitting = false,
  submitText = 'Submit',
  isDisabled = false,
  cancelText,
  onCancel,
  error,
  success,
  className,
  actionsClassName,
  testId,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSubmitting && !isDisabled) {
      onSubmit(e);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={cn('space-y-6', className)}
      data-testid={testId}
    >
      {error && (
        <Alert 
          variant="error" 
          title="Error" 
          description={error}
          dismissible
        />
      )}
      
      {success && (
        <Alert 
          variant="success" 
          title="Success" 
          description={success}
          dismissible
        />
      )}
      
      <div className="space-y-4">
        {children}
      </div>
      
      <div className={cn(
        'flex items-center',
        onCancel ? 'justify-between' : 'justify-end',
        actionsClassName
      )}>
        {onCancel && cancelText && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelText}
          </Button>
        )}
        
        <Button
          type="submit"
          disabled={isDisabled || isSubmitting}
          loading={isSubmitting}
        >
          {submitText}
        </Button>
      </div>
    </form>
  );
};

/**
 * Form.Field component
 * 
 * A convenience component for creating form fields within a Form component.
 */
Form.Field = FormField;