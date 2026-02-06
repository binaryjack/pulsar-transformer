/**
 * Debug Logger Constructor
 *
 * Prototype-based debug logger for transformation visibility.
 */

import type { IDebugLoggerConfig, IDebugLoggerInternal } from './debug-logger.types.js';

/**
 * Debug Logger constructor function
 */
export const DebugLogger = function (this: IDebugLoggerInternal, config: IDebugLoggerConfig) {
  // Store configuration
  Object.defineProperty(this, 'config', {
    value: config,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  // Initialize log collection
  Object.defineProperty(this, 'logs', {
    value: [],
    writable: true,
    enumerable: false,
    configurable: false,
  });

  // Store start time for performance tracking
  Object.defineProperty(this, 'startTime', {
    value: Date.now(),
    writable: false,
    enumerable: false,
    configurable: false,
  });
} as unknown as { new (config: IDebugLoggerConfig): IDebugLoggerInternal };
