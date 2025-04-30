/**
 * TerraFusion UI Types
 * Shared types for the UI component library
 */

// Common types
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Variant = 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
export type Status = 'idle' | 'loading' | 'success' | 'error' | 'warning';

// Component-specific types
export interface BaseProps {
  className?: string;
  testId?: string;
}

// Re-export additional type files as needed
// export * from './button-types';
// export * from './form-types';