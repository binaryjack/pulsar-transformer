/**
 * Has Import Method
 *
 * Checks if an import exists.
 */

import type { IImportTrackerInternal } from '../emitter.types.js';

/**
 * Check if import exists
 */
export function hasImport(
  this: IImportTrackerInternal,
  source: string,
  specifier: string
): boolean {
  const specifiers = this.imports.get(source);
  return specifiers ? specifiers.has(specifier) : false;
}
