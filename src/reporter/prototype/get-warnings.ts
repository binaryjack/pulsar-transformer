/**
 * TransformationReporter.getWarnings() - Prototype Method
 *
 * Returns all collected warnings.
 *
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype method pattern
 */

import type {
  ITransformationReporterInternal,
  ITransformationIssue,
} from '../transformation-reporter.types.js';

/**
 * Get all warnings from the collection
 *
 * @returns Array of transformation issues (warnings)
 */
export function getWarnings(this: ITransformationReporterInternal): ITransformationIssue[] {
  return this._warnings;
}
