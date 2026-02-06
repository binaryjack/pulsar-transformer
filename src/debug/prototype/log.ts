/**
 * Debug Logger log method
 */

import type { DebugChannel, DebugLevel, IDebugLoggerInternal } from '../debug-logger.types.js';

/**
 * Log a message to a specific channel
 */
export function log(
  this: IDebugLoggerInternal,
  channel: DebugChannel,
  level: DebugLevel,
  message: string,
  data?: unknown
): void {
  if (!this.config.enabled) {
    return;
  }

  // Check if channel is enabled
  if (this.config.channels && !this.config.channels.includes(channel)) {
    return;
  }

  // Check minimum level
  const levels: DebugLevel[] = ['trace', 'debug', 'info', 'warn', 'error'];
  const minLevelIndex = this.config.minLevel ? levels.indexOf(this.config.minLevel) : 0;
  const currentLevelIndex = levels.indexOf(level);

  if (currentLevelIndex < minLevelIndex) {
    return;
  }

  const timestamp = Date.now();
  const duration = this.config.performance ? timestamp - this.startTime : undefined;

  // Create log entry
  const entry = {
    timestamp,
    channel,
    level,
    message,
    data,
    duration,
  };

  // Collect logs if enabled
  if (this.config.collectLogs) {
    this.logs.push(entry);
  }

  // Output to console if enabled
  if (this.config.console) {
    const prefix = this.config.timestamps ? `[${new Date(timestamp).toISOString()}] ` : '';
    const channelPrefix = `[${channel.toUpperCase()}]`;
    const perfSuffix = duration !== undefined ? ` (+${duration}ms)` : '';

    const fullMessage = `${prefix}${channelPrefix} ${message}${perfSuffix}`;

    switch (level) {
      case 'error':
        console.error(fullMessage, data || '');
        break;
      case 'warn':
        console.warn(fullMessage, data || '');
        break;
      case 'trace':
      case 'debug':
        console.debug(fullMessage, data || '');
        break;
      default:
        console.log(fullMessage, data || '');
    }
  }
}
