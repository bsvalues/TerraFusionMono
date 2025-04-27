/**
 * TerraFusion design tokens
 * 
 * This file defines all the design tokens used throughout the TerraFusionMono platform.
 * These tokens establish a consistent visual language across all UI components.
 */

// Primary brand colors
export const brandColors = {
  // Green palette (represents crops, vegetation, growth)
  terrafusionGreen: {
    50: '#f0f9e8',
    100: '#dff2d0',
    200: '#bfe5a7',
    300: '#9dd775',
    400: '#7cc846',
    500: '#5ab825',
    600: '#47931c',
    700: '#377018',
    800: '#2a5012',
    900: '#1e3b0c',
    950: '#0f2106',
  },
  
  // Blue palette (represents water, technology, innovation)
  terrafusionBlue: {
    50: '#eff6fe',
    100: '#dfeafc',
    200: '#c7d7f9',
    300: '#9dbdf4',
    400: '#749eec',
    500: '#5b7de5',
    600: '#4a60d8',
    700: '#4150c4',
    800: '#36429f',
    900: '#303b7e',
    950: '#1e234d',
  },
  
  // Earth/soil palette (represents land, soil, agriculture)
  terrafusionSoil: {
    50: '#f9f5ed',
    100: '#f1e8d6',
    200: '#e4d2b3',
    300: '#d6b688',
    400: '#c89660',
    500: '#bc7c45',
    600: '#a4623a',
    700: '#874d32',
    800: '#6f3f2c',
    900: '#5c3526',
    950: '#341b15',
  },
};

// Semantic colors
export const semanticColors = {
  // Success states
  success: {
    light: brandColors.terrafusionGreen[100],
    default: brandColors.terrafusionGreen[500],
    dark: brandColors.terrafusionGreen[700],
    contrast: '#ffffff',
  },
  
  // Error states
  error: {
    light: '#fee2e2',
    default: '#ef4444',
    dark: '#b91c1c',
    contrast: '#ffffff',
  },
  
  // Warning states
  warning: {
    light: '#fef3c7',
    default: brandColors.terrafusionSoil[500],
    dark: brandColors.terrafusionSoil[700],
    contrast: '#ffffff',
  },
  
  // Info states
  info: {
    light: brandColors.terrafusionBlue[100],
    default: brandColors.terrafusionBlue[500],
    dark: brandColors.terrafusionBlue[700],
    contrast: '#ffffff',
  },
};

// Typography
export const typography = {
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"Roboto Mono", SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  fontSizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
};

// Spacing
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  7: '1.75rem',    // 28px
  8: '2rem',       // 32px
  9: '2.25rem',    // 36px
  10: '2.5rem',    // 40px
  11: '2.75rem',   // 44px
  12: '3rem',      // 48px
  14: '3.5rem',    // 56px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  28: '7rem',      // 112px
  32: '8rem',      // 128px
  36: '9rem',      // 144px
  40: '10rem',     // 160px
  44: '11rem',     // 176px
  48: '12rem',     // 192px
  52: '13rem',     // 208px
  56: '14rem',     // 224px
  60: '15rem',     // 240px
  64: '16rem',     // 256px
  72: '18rem',     // 288px
  80: '20rem',     // 320px
  96: '24rem',     // 384px
};

// Border radius
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  default: '0.25rem',// 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',   // Full rounded (circles)
};

// Shadows
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  none: 'none',
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
  dropdown: '1000',
  sticky: '1100',
  fixed: '1200',
  drawer: '1300',
  modal: '1400',
  popover: '1500',
  toast: '1600',
  tooltip: '1700',
};

// Transitions
export const transitions = {
  default: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  fast: 'all 100ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
};