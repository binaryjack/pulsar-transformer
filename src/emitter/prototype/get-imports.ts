/**
 * Get Imports Method
 *
 * Returns all tracked imports.
 */

import type { IImportTrackerInternal } from '../emitter.types.js';

/**
 * Get all imports
 */
export function getImports(this: IImportTrackerInternal): Map<string, Set<string>> {
  return this.imports;
}
