/**
 * Debug Logger clearLogs method
 */

import type { IDebugLoggerInternal } from '../debug-logger.types.js';

/**
 * Clear accumulated logs
 */
export function clearLogs(this: IDebugLoggerInternal): void {
  this.logs = [];
}
