/**
 * Simple logger utility for the crop identifier service
 */
export class Logger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  info(message: string): void {
    console.log(`[${this.getTimestamp()}] [${this.serviceName}] [INFO] ${message}`);
  }

  warn(message: string): void {
    console.warn(`[${this.getTimestamp()}] [${this.serviceName}] [WARN] ${message}`);
  }

  error(message: string): void {
    console.error(`[${this.getTimestamp()}] [${this.serviceName}] [ERROR] ${message}`);
  }

  debug(message: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${this.getTimestamp()}] [${this.serviceName}] [DEBUG] ${message}`);
    }
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }
}