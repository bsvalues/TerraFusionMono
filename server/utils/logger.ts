/**
 * Logger utility for the application
 * Provides consistent logging across the system
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private context: string = 'app';

  /**
   * Create a new logger instance
   * @param context Optional context for the logger
   */
  constructor(context?: string) {
    if (context) {
      this.context = context;
    }
  }

  /**
   * Log a debug message
   * @param message Message to log
   * @param metadata Optional metadata
   */
  debug(message: string, metadata?: any): void {
    this.log('debug', message, metadata);
  }

  /**
   * Log an info message
   * @param message Message to log
   * @param metadata Optional metadata
   */
  info(message: string, metadata?: any): void {
    this.log('info', message, metadata);
  }

  /**
   * Log a warning message
   * @param message Message to log
   * @param metadata Optional metadata
   */
  warn(message: string, metadata?: any): void {
    this.log('warn', message, metadata);
  }

  /**
   * Log an error message
   * @param message Message to log
   * @param metadata Optional metadata
   */
  error(message: string, metadata?: any): void {
    this.log('error', message, metadata);
  }

  /**
   * Internal log method
   * @param level Log level
   * @param message Message to log
   * @param metadata Optional metadata
   */
  private log(level: LogLevel, message: string, metadata?: any): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `${timestamp} [${this.context}] ${level.toUpperCase()}: ${message}`;
    
    switch (level) {
      case 'debug':
        if (process.env.NODE_ENV !== 'production') {
          console.debug(formattedMessage, metadata ? metadata : '');
        }
        break;
      case 'info':
        console.info(formattedMessage, metadata ? metadata : '');
        break;
      case 'warn':
        console.warn(formattedMessage, metadata ? metadata : '');
        break;
      case 'error':
        console.error(formattedMessage, metadata ? metadata : '');
        break;
    }
  }
}

// Export a default logger instance
export const logger = new Logger('server');

// Export the Logger class for custom instances
export default Logger;