/**
 * Add Import Method
 *
 * Adds an import to the tracker.
 */

import type { IImportTrackerInternal } from '../emitter.types.js';

/**
 * Add an import
 */
export function addImport(this: IImportTrackerInternal, source: string, specifier: string): void {
  if (!this.imports.has(source)) {
    this.imports.set(source, new Set());
  }

  // Convert empty string to null for side-effect imports
  this.imports.get(source)!.add(specifier === '' ? null : specifier);
}
