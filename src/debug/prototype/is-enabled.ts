/**
 * Debug Logger isEnabled method
 */

import type { DebugChannel, IDebugLoggerInternal } from '../debug-logger.types.js';

/**
 * Check if a channel is enabled
 */
export function isEnabled(this: IDebugLoggerInternal, channel: DebugChannel): boolean {
  if (!this.config.enabled) {
    return false;
  }

  if (!this.config.channels) {
    return true;
  }

  return this.config.channels.includes(channel);
}
