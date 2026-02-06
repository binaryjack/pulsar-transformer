/**
 * Debug Logger getLogs method
 */

import type { IDebugLogEntry, IDebugLoggerInternal } from '../debug-logger.types.js';

/**
 * Get accumulated logs
 */
export function getLogs(this: IDebugLoggerInternal): IDebugLogEntry[] {
  return [...this.logs];
}
