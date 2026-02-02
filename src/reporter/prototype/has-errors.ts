/**
 * TransformationReporter.hasErrors() - Prototype Method
 *
 * Checks if any errors have been collected.
 *
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype method pattern
 */

import type { ITransformationReporterInternal } from '../transformation-reporter.types.js';

/**
 * Check if errors exist in the collection
 *
 * @returns true if errors exist, false otherwise
 */
export function hasErrors(this: ITransformationReporterInternal): boolean {
  return this._errors.length > 0;
}
