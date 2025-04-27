// Color scales
export const colors = {
  // Brand colors
  terrafusionGreen: {
    50: 'hsl(142, 76%, 95%)',
    100: 'hsl(142, 70%, 90%)',
    200: 'hsl(142, 65%, 80%)',
    300: 'hsl(142, 60%, 70%)',
    400: 'hsl(142, 55%, 60%)',
    500: 'hsl(142, 50%, 50%)',
    600: 'hsl(142, 60%, 40%)',
    700: 'hsl(142, 65%, 30%)',
    800: 'hsl(142, 70%, 20%)',
    900: 'hsl(142, 75%, 10%)',
  },
  terrafusionBlue: {
    50: 'hsl(210, 100%, 95%)',
    100: 'hsl(210, 100%, 90%)',
    200: 'hsl(210, 95%, 80%)',
    300: 'hsl(210, 90%, 70%)',
    400: 'hsl(210, 85%, 60%)',
    500: 'hsl(210, 80%, 50%)',
    600: 'hsl(210, 85%, 40%)',
    700: 'hsl(210, 90%, 30%)',
    800: 'hsl(210, 95%, 20%)',
    900: 'hsl(210, 100%, 10%)',
  },
  terrafusionSoil: {
    50: 'hsl(30, 70%, 95%)',
    100: 'hsl(30, 65%, 90%)',
    200: 'hsl(30, 60%, 80%)',
    300: 'hsl(30, 55%, 70%)',
    400: 'hsl(30, 50%, 60%)',
    500: 'hsl(30, 45%, 50%)',
    600: 'hsl(30, 50%, 40%)',
    700: 'hsl(30, 55%, 30%)',
    800: 'hsl(30, 60%, 20%)',
    900: 'hsl(30, 65%, 10%)',
  },
  
  // Status colors
  status: {
    success: 'hsl(142, 70%, 45%)',
    warning: 'hsl(38, 92%, 50%)',
    error: 'hsl(0, 84%, 60%)',
    info: 'hsl(210, 92%, 45%)',
  },
  
  // Crop health colors
  health: {
    excellent: 'hsl(142, 70%, 45%)',
    good: 'hsl(100, 70%, 45%)',
    moderate: 'hsl(38, 92%, 50%)',
    poor: 'hsl(25, 90%, 50%)',
    critical: 'hsl(0, 84%, 60%)',
  },
  
  // Chart colors
  chart: [
    'hsl(142, 60%, 50%)',
    'hsl(210, 80%, 50%)',
    'hsl(30, 45%, 50%)',
    'hsl(275, 80%, 50%)',
    'hsl(0, 80%, 50%)',
  ],
};

// Typography
export const typography = {
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// Spacing
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  36: '9rem',
  40: '10rem',
  44: '11rem',
  48: '12rem',
  52: '13rem',
  56: '14rem',
  60: '15rem',
  64: '16rem',
  72: '18rem',
  80: '20rem',
  96: '24rem',
};

// Border radius
export const borderRadius = {
  none: '0',
  sm: 'calc(var(--radius) - 4px)',
  DEFAULT: 'var(--radius)',
  md: 'calc(var(--radius) - 2px)',
  lg: 'var(--radius)',
  xl: 'calc(var(--radius) + 4px)',
  '2xl': 'calc(var(--radius) + 8px)',
  full: '9999px',
};

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
};

// Transitions
export const transitions = {
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

// Z-index
export const zIndex = {
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  auto: 'auto',
};