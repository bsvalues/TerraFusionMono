/**
 * Logging utility for crop health module
 */
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[crop-health] INFO: ${message}`, ...args);
  },
  
  warn: (message: string, ...args: any[]) => {
    console.warn(`[crop-health] WARN: ${message}`, ...args);
  },
  
  error: (message: string, error?: any) => {
    console.error(`[crop-health] ERROR: ${message}`, error || '');
  },
  
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[crop-health] DEBUG: ${message}`, ...args);
    }
  }
};