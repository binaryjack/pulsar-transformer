/**
 * Debug Logger Prototype Methods
 *
 * Attach all prototype methods to DebugLogger.
 */

import { DebugLogger } from '../debug-logger.js';
import { clearLogs } from './clear-logs.js';
import { error } from './error.js';
import { getLogs } from './get-logs.js';
import { isEnabled } from './is-enabled.js';
import { log } from './log.js';

// Attach prototype methods
DebugLogger.prototype.log = log;
DebugLogger.prototype.error = error;
DebugLogger.prototype.isEnabled = isEnabled;
DebugLogger.prototype.getLogs = getLogs;
DebugLogger.prototype.clearLogs = clearLogs;
