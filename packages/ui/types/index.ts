/**
 * TerraFusion UI Types
 * 
 * Common type definitions used across the UI component library.
 */

/**
 * Base props for all UI components.
 * Provides consistent testing, accessibility, and extensibility properties.
 */
export interface BaseProps {
  /**
   * Data test ID for testing.
   * This ID can be used to select elements in automated tests.
   */
  testId?: string;
  
  /**
   * ARIA role for accessibility.
   */
  role?: string;
  
  /**
   * ARIA label for accessibility.
   */
  ariaLabel?: string;
  
  /**
   * ARIA labelledby for accessibility.
   */
  ariaLabelledBy?: string;
  
  /**
   * ARIA described by for accessibility.
   */
  ariaDescribedBy?: string;
}