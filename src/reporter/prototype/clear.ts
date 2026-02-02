/**
 * TransformationReporter.clear() - Prototype Method
 *
 * Clears all collected errors and warnings.
 *
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype method pattern
 */

import type { ITransformationReporterInternal } from '../transformation-reporter.types.js';

/**
 * Clear all errors and warnings from the collection
 */
export function clear(this: ITransformationReporterInternal): void {
  this._errors.length = 0;
  this._warnings.length = 0;
}
