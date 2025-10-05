import { config } from './config';

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

/**
 * Simple production-ready logger
 */
class Logger {
  private isDevelopment = config.nodeEnv === 'development';

  /**
   * Formats log message with timestamp and level
   */
  private formatMessage(level: LogLevel, message: string, meta?: object): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  }

  /**
   * Log error message
   */
  error(message: string, meta?: object): void {
    console.error(this.formatMessage(LogLevel.ERROR, message, meta));
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: object): void {
    console.warn(this.formatMessage(LogLevel.WARN, message, meta));
  }

  /**
   * Log info message
   */
  info(message: string, meta?: object): void {
    console.log(this.formatMessage(LogLevel.INFO, message, meta));
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, meta?: object): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, meta));
    }
  }
}

export const logger = new Logger();
