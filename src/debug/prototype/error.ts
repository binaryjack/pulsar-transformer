/**
 * Debug Logger error method
 */

import type { DebugChannel, IDebugLoggerInternal } from '../debug-logger.types.js';

/**
 * Log an error with full context
 */
export function error(
  this: IDebugLoggerInternal,
  channel: DebugChannel,
  message: string,
  err: Error,
  data?: unknown
): void {
  const errorData: Record<string, unknown> = {
    message: err.message,
    stack: err.stack,
    name: err.name,
  };

  if (data && typeof data === 'object') {
    Object.assign(errorData, data);
  }

  this.log(channel, 'error', message, errorData);
}
