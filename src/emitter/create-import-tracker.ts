/**
 * Create Import Tracker Factory
 *
 * Factory function for creating ImportTracker instances.
 */

import type { IImportTracker } from './emitter.types.js';
import { ImportTracker } from './import-tracker.js';
import './prototype/index.js'; // Ensure prototype methods are attached

/**
 * Create an import tracker instance
 */
export function createImportTracker(): IImportTracker {
  return new ImportTracker() as unknown as IImportTracker;
}
