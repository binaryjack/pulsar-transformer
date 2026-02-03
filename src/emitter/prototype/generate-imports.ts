/**
 * Generate Imports Method
 *
 * Generates all import statements.
 */

import type { IImportTrackerInternal } from '../emitter.types.js';

/**
 * Generate import statements
 */
export function generateImports(this: IImportTrackerInternal): string {
  const lines: string[] = [];

  // Sort sources for consistent output
  const sources = Array.from(this.imports.keys()).sort();

  for (const source of sources) {
    const specifiers = this.imports.get(source)!;
    lines.push(this._formatImport(source, specifiers));
  }

  return lines.join('\n');
}
