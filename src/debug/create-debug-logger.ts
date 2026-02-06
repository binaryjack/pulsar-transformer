/**
 * Debug Logger Factory
 *
 * Creates debug logger instances with default configuration.
 */

import { DebugLogger } from './debug-logger.js';
import type { IDebugLogger, IDebugLoggerConfig } from './debug-logger.types.js';
import './prototype/index.js';

/**
 * Create a debug logger instance
 */
export function createDebugLogger(config?: Partial<IDebugLoggerConfig>): IDebugLogger {
  const defaultConfig: IDebugLoggerConfig = {
    enabled: false,
    console: true,
    collectLogs: false,
    timestamps: true,
    performance: true,
    minLevel: 'debug',
  };

  const finalConfig: IDebugLoggerConfig = {
    ...defaultConfig,
    ...config,
  };

  return new DebugLogger(finalConfig);
}
