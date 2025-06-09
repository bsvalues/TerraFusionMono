import React from 'react';
import { cn } from '../../utils/cn';
import { type BaseProps } from '../../types';

export type IconColor =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'muted'
  | 'current'
  | 'inherit';

export type IconSize =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl';

export interface IconProps extends BaseProps {
  /**
   * The icon component to render
   */
  icon: React.ReactElement;
  
  /**
   * The size of the icon
   */
  size?: IconSize;
  
  /**
   * The color of the icon
   */
  color?: IconColor;
  
  /**
   * Swap the horizontal orientation
   */
  flipHorizontal?: boolean;
  
  /**
   * Swap the vertical orientation
   */
  flipVertical?: boolean;
  
  /**
   * Rotate the icon by the specified degrees
   */
  rotate?: 0 | 90 | 180 | 270;
  
  /**
   * Additional class names
   */
  className?: string;
  
  /**
   * Specify an accessible label
   */
  label?: string;
}

/**
 * Icon component
 * 
 * A wrapper component that provides consistent sizing and styling for icons.
 * Works with various icon libraries like Lucide, React Icons, etc.
 */
export const Icon: React.FC<IconProps> = ({
  icon,
  size = 'md',
  color = 'current',
  flipHorizontal = false,
  flipVertical = false,
  rotate = 0,
  className,
  label,
  testId,
  ...props
}) => {
  // Size classes
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10',
    '3xl': 'w-12 h-12',
  };

  // Color classes
  const colorClasses = {
    primary: 'text-primary-700',
    secondary: 'text-neutral-700',
    success: 'text-success-700',
    warning: 'text-warning-700',
    error: 'text-error-700',
    info: 'text-info-700',
    muted: 'text-neutral-500',
    current: 'text-current',
    inherit: 'text-inherit',
  };

  // Transform classes
  const transformClasses = [];
  
  if (flipHorizontal) transformClasses.push('scale-x-[-1]');
  if (flipVertical) transformClasses.push('scale-y-[-1]');
  
  if (rotate === 90) transformClasses.push('rotate-90');
  if (rotate === 180) transformClasses.push('rotate-180');
  if (rotate === 270) transformClasses.push('rotate-[-90deg]');

  // Clone the icon element with the appropriate classes
  const enhancedIcon = React.cloneElement(icon, {
    className: cn(
      sizeClasses[size],
      colorClasses[color],
      transformClasses.join(' '),
      className
    ),
    'aria-hidden': !label,
    'aria-label': label,
    'data-testid': testId,
    ...props,
  });

  return enhancedIcon;
};