/**
 * Debug Logger - Fine-grained configurable logging system
 * Provides channel-based logging with levels and performance tracking
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';
export type LogChannel = 'lexer' | 'parser' | 'codegen' | 'pipeline' | 'jsx' | 'transform';

export interface ILoggerOptions {
  enabled?: boolean;
  level?: LogLevel;
  channels?: LogChannel[];
  timestamps?: boolean;
  colors?: boolean;
  performance?: boolean;
}

export interface ILogger {
  error(channel: LogChannel, message: string, data?: any): void;
  warn(channel: LogChannel, message: string, data?: any): void;
  info(channel: LogChannel, message: string, data?: any): void;
  debug(channel: LogChannel, message: string, data?: any): void;
  trace(channel: LogChannel, message: string, data?: any): void;
  time(label: string): void;
  timeEnd(label: string): void;
  group(label: string): void;
  groupEnd(): void;
  setLevel(level: LogLevel): void;
  setChannels(channels: LogChannel[]): void;
  isEnabled(channel: LogChannel, level: LogLevel): boolean;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  error: '\x1b[31m', // Red
  warn: '\x1b[33m',  // Yellow
  info: '\x1b[36m',  // Cyan
  debug: '\x1b[90m', // Gray
  trace: '\x1b[90m', // Gray
};

const CHANNEL_COLORS: Record<LogChannel, string> = {
  lexer: '\x1b[35m',    // Magenta
  parser: '\x1b[34m',   // Blue
  codegen: '\x1b[32m',  // Green
  pipeline: '\x1b[36m', // Cyan
  jsx: '\x1b[33m',      // Yellow
  transform: '\x1b[35m', // Magenta
};

const RESET = '\x1b[0m';

/**
 * Logger implementation
 */
export function Logger(this: ILogger, options: ILoggerOptions = {}): void {
  const enabled = options.enabled ?? false;
  const level = options.level ?? 'info';
  const channels = options.channels ?? [];
  const timestamps = options.timestamps ?? true;
  const colors = options.colors ?? true;
  const trackPerformance = options.performance ?? true;
  const timers = new Map<string, number>();
  let groupLevel = 0;

  this.isEnabled = (channel: LogChannel, logLevel: LogLevel): boolean => {
    if (!enabled) return false;
    if (channels.length > 0 && !channels.includes(channel)) return false;
    return LEVEL_PRIORITY[logLevel] <= LEVEL_PRIORITY[level];
  };

  const log = (channel: LogChannel, logLevel: LogLevel, message: string, data?: any): void => {
    if (!this.isEnabled(channel, logLevel)) return;

    const parts: string[] = [];
    
    // Timestamp
    if (timestamps) {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
      parts.push(colors ? `\x1b[90m${time}${RESET}` : time);
    }

    // Level
    const levelStr = logLevel.toUpperCase().padEnd(5);
    parts.push(colors ? `${LEVEL_COLORS[logLevel]}${levelStr}${RESET}` : levelStr);

    // Channel
    const channelStr = `[${channel}]`.padEnd(10);
    parts.push(colors ? `${CHANNEL_COLORS[channel]}${channelStr}${RESET}` : channelStr);

    // Indent for groups
    const indent = '  '.repeat(groupLevel);
    
    // Message
    parts.push(indent + message);

    console.log(parts.join(' '));

    // Data
    if (data !== undefined) {
      console.log(indent + '  ', data);
    }
  };

  this.error = (channel: LogChannel, message: string, data?: any): void => {
    log(channel, 'error', message, data);
  };

  this.warn = (channel: LogChannel, message: string, data?: any): void => {
    log(channel, 'warn', message, data);
  };

  this.info = (channel: LogChannel, message: string, data?: any): void => {
    log(channel, 'info', message, data);
  };

  this.debug = (channel: LogChannel, message: string, data?: any): void => {
    log(channel, 'debug', message, data);
  };

  this.trace = (channel: LogChannel, message: string, data?: any): void => {
    log(channel, 'trace', message, data);
  };

  this.time = (label: string): void => {
    if (!trackPerformance) return;
    timers.set(label, performance.now());
  };

  this.timeEnd = (label: string): void => {
    if (!trackPerformance) return;
    const start = timers.get(label);
    if (start !== undefined) {
      const duration = performance.now() - start;
      this.debug('pipeline', `⏱️  ${label}: ${duration.toFixed(2)}ms`);
      timers.delete(label);
    }
  };

  this.group = (label: string): void => {
    if (!enabled) return;
    console.log('  '.repeat(groupLevel) + `▼ ${label}`);
    groupLevel++;
  };

  this.groupEnd = (): void => {
    if (!enabled) return;
    if (groupLevel > 0) groupLevel--;
  };

  this.setLevel = (newLevel: LogLevel): void => {
    (level as any) = newLevel;
  };

  this.setChannels = (newChannels: LogChannel[]): void => {
    channels.length = 0;
    channels.push(...newChannels);
  };
}

// Type-safe constructor
export const createLogger = (options?: ILoggerOptions): ILogger => {
  return new (Logger as any)(options) as ILogger;
};

// Singleton instance
let globalLogger: ILogger | null = null;

export const getLogger = (): ILogger => {
  if (!globalLogger) {
    globalLogger = createLogger();
  }
  return globalLogger;
};

export const setGlobalLogger = (logger: ILogger): void => {
  globalLogger = logger;
};
