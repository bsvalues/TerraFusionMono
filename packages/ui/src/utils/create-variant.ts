import { type ClassValue } from 'clsx';

/**
 * Creates a typesafe variant creator function
 * @param variants Map of variant options to class strings
 * @returns A function that takes a variant name and returns the matching class string
 */
export function createVariant<T extends Record<string, Record<string, ClassValue>>>(
  variants: T
) {
  type VariantProps = {
    [K in keyof T]?: keyof T[K];
  };

  return (props: VariantProps) => {
    const classes: ClassValue[] = [];
    
    for (const variantName in variants) {
      if (props[variantName] !== undefined) {
        const variant = variants[variantName][props[variantName] as string];
        if (variant) {
          classes.push(variant);
        }
      }
    }
    
    return classes;
  };
}