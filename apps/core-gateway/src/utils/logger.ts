/**
 * Logger utility for TerraFusion Core Gateway
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  level: LogLevel;
  serviceName: string;
}

class Logger {
  private level: LogLevel;
  private serviceName: string;

  constructor(options: LoggerOptions) {
    this.level = options.level;
    this.serviceName = options.serviceName;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.level);
    const logLevelIndex = levels.indexOf(level);

    return logLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${this.serviceName}] ${message}${formattedArgs}`;
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, args));
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, args));
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, args));
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, args));
    }
  }

  // Also logs to database for persistent logging
  async logToDB(level: LogLevel, message: string, metadata: Record<string, any> = {}): Promise<void> {
    if (this.shouldLog(level)) {
      // In a real implementation, this would insert into the database
      // Example: await db.insert(systemLogs).values({
      //   level,
      //   source: this.serviceName,
      //   message,
      //   metadata,
      // });
      
      // For now, just log to console
      console.log(this.formatMessage(level, `DB: ${message}`, [metadata]));
    }
  }
}

// Create a default logger instance for the application
export const logger = new Logger({
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  serviceName: 'core-gateway',
});

export default Logger;