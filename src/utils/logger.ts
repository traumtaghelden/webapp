type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private formatMessage(entry: LogEntry): string {
    const { level, message, context, timestamp } = entry;
    const prefix = context ? `[${context}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${prefix} ${message}`;
  }

  private log(level: LogLevel, message: string, context?: string, data?: unknown): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      data,
      timestamp: new Date().toISOString(),
    };

    if (!this.isDevelopment && level === 'debug') {
      return;
    }

    const formattedMessage = this.formatMessage(entry);

    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.log(formattedMessage, data || '');
        }
        break;
      case 'info':
        console.info(formattedMessage, data || '');
        break;
      case 'warn':
        console.warn(formattedMessage, data || '');
        break;
      case 'error':
        console.error(formattedMessage, data || '');
        if (data instanceof Error) {
          console.error(data.stack);
        }
        break;
    }
  }

  debug(message: string, context?: string, data?: unknown): void {
    this.log('debug', message, context, data);
  }

  info(message: string, context?: string, data?: unknown): void {
    this.log('info', message, context, data);
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.log('warn', message, context, data);
  }

  error(message: string, context?: string, data?: unknown): void {
    this.log('error', message, context, data);
  }
}

export const logger = new Logger();
