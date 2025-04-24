/**
 * Logger utility for crop health module
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private serviceName: string;
  
  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }
  
  private formatMessage(level: string, message: string, metadata?: any): string {
    const timestamp = new Date().toISOString();
    const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${this.serviceName}] ${message}${metadataStr}`;
  }
  
  debug(message: string, metadata?: any): void {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(this.formatMessage('debug', message, metadata));
    }
  }
  
  info(message: string, metadata?: any): void {
    console.info(this.formatMessage('info', message, metadata));
  }
  
  warn(message: string, metadata?: any): void {
    console.warn(this.formatMessage('warn', message, metadata));
  }
  
  error(message: string, error?: any): void {
    const errorDetails = error instanceof Error 
      ? error.stack || error.message
      : JSON.stringify(error);
    
    console.error(this.formatMessage('error', message, { error: errorDetails }));
  }
}

// Create and export a default logger instance
export const logger = new Logger('crop-health');