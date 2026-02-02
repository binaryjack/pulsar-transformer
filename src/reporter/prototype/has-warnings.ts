/**
 * TransformationReporter.hasWarnings() - Prototype Method
 *
 * Checks if any warnings have been collected.
 *
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype method pattern
 */

import type { ITransformationReporterInternal } from '../transformation-reporter.types.js';

/**
 * Check if warnings exist in the collection
 *
 * @returns true if warnings exist, false otherwise
 */
export function hasWarnings(this: ITransformationReporterInternal): boolean {
  return this._warnings.length > 0;
}
