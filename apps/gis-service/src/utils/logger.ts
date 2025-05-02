/**
 * Simple logger utility for the GIS service
 */
export class Logger {
  private readonly service: string;
  
  constructor(service: string) {
    this.service = service;
  }
  
  info(message: string): void {
    console.log(`[${this.timestamp()}] [${this.service}] INFO: ${message}`);
  }
  
  warn(message: string): void {
    console.warn(`[${this.timestamp()}] [${this.service}] WARN: ${message}`);
  }
  
  error(message: string): void {
    console.error(`[${this.timestamp()}] [${this.service}] ERROR: ${message}`);
  }
  
  debug(message: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${this.timestamp()}] [${this.service}] DEBUG: ${message}`);
    }
  }
  
  private timestamp(): string {
    return new Date().toISOString();
  }
}