/**
 * Import Tracker Constructor
 *
 * Tracks imports used during code generation.
 */

import type { IImportTrackerInternal } from './emitter.types.js';

/**
 * Import tracker constructor (prototype-based)
 */
export const ImportTracker = function (this: IImportTrackerInternal) {
  // Initialize imports Map
  Object.defineProperty(this, 'imports', {
    value: new Map<string, Set<string>>(),
    writable: false,
    enumerable: false,
    configurable: false,
  });
} as unknown as { new (): IImportTrackerInternal };
