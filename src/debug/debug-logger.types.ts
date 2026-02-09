/**
 * Debug Logger Type Definitions
 *
 * Types for the transformation debug logging system.
 */

/**
 * Debug log levels
 */
export type DebugLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

/**
 * Debug channels for targeted logging
 */
export type DebugChannel =
  | 'lexer'
  | 'parser'
  | 'analyzer'
  | 'transform'
  | 'emitter'
  | 'validator'
  | 'pipeline'
  | 'signal-binding'
  | 'wire'
  | 'reactivity'
  | 'effect'
  | 'signal-creation';

/**
 * Public Debug Logger interface
 */
export interface IDebugLogger {
  /**
   * Log a message to a specific channel
   */
  log(channel: DebugChannel, level: DebugLevel, message: string, data?: unknown): void;

  /**
   * Log an error with full context
   */
  error(channel: DebugChannel, message: string, error: Error, data?: unknown): void;

  /**
   * Check if a channel is enabled
   */
  isEnabled(channel: DebugChannel): boolean;

  /**
   * Get accumulated logs
   */
  getLogs(): IDebugLogEntry[];

  /**
   * Clear accumulated logs
   */
  clearLogs(): void;
}

/**
 * Internal Debug Logger interface
 */
export interface IDebugLoggerInternal extends IDebugLogger {
  config: IDebugLoggerConfig;
  logs: IDebugLogEntry[];
  startTime: number;
}

/**
 * Debug logger configuration
 */
export interface IDebugLoggerConfig {
  /**
   * Enable debug logging
   */
  enabled: boolean;

  /**
   * Enabled channels (if not specified, all enabled)
   */
  channels?: DebugChannel[];

  /**
   * Minimum log level
   */
  minLevel?: DebugLevel;

  /**
   * Output to console
   */
  console: boolean;

  /**
   * Collect logs in memory
   */
  collectLogs: boolean;

  /**
   * Include timestamps
   */
  timestamps: boolean;

  /**
   * Include performance metrics
   */
  performance: boolean;
}

/**
 * Debug log entry
 */
export interface IDebugLogEntry {
  timestamp: number;
  channel: DebugChannel;
  level: DebugLevel;
  message: string;
  data?: unknown;
  duration?: number;
}
