import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names and merges Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type VariantProps = Record<string, Record<string, string>>;

/**
 * Create a variant-based class generator that merges multiple classes
 * to create cohesive component variants.
 * 
 * @example
 * const buttonVariants = createVariant({
 *   variant: {
 *     default: 'bg-primary text-primary-foreground',
 *     secondary: 'bg-secondary text-secondary-foreground'
 *   },
 *   size: {
 *     default: 'h-10 px-4 py-2',
 *     sm: 'h-9 px-3',
 *     lg: 'h-11 px-8'
 *   }
 * });
 * 
 * // Use it like this:
 * const classes = buttonVariants({ variant: 'default', size: 'lg' });
 */
export const createVariant = (variants: VariantProps) => {
  return (props: { [key: string]: string | null | undefined }): string[] => {
    const classArray: string[] = [];
    
    for (const variantKey in variants) {
      const value = props[variantKey];
      
      if (value && variants[variantKey][value]) {
        classArray.push(variants[variantKey][value]);
      } else if (variants[variantKey].default) {
        classArray.push(variants[variantKey].default);
      }
    }
    
    return classArray;
  };
};

/**
 * Format a timestamp as a relative time string
 * (e.g., "5 minutes ago", "2 days ago")
 */
export function formatRelativeTime(date: Date | null): string {
  if (!date) return 'Never';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  
  // Less than a minute
  if (diffSecs < 60) {
    return diffSecs <= 5 ? 'Just now' : `${diffSecs} seconds ago`;
  }
  
  // Less than an hour
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  // Less than a day
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  // Less than a week
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  }
  
  // Less than a month
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) {
    return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
  }
  
  // Less than a year
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  }
  
  // Years
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
}

/**
 * Format bytes to human-readable size
 * (e.g., 1024 -> "1 KB", 1048576 -> "1 MB")
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Generate a unique string ID
 */
export function generateId(prefix = ''): string {
  return `${prefix}${Math.random().toString(36).substring(2, 9)}`;
}