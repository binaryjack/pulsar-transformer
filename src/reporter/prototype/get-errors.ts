/**
 * TransformationReporter.getErrors() - Prototype Method
 *
 * Returns all collected errors.
 *
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype method pattern
 */

import type {
  ITransformationReporterInternal,
  ITransformationIssue,
} from '../transformation-reporter.types.js';

/**
 * Get all errors from the collection
 *
 * @returns Array of transformation issues (errors)
 */
export function getErrors(this: ITransformationReporterInternal): ITransformationIssue[] {
  return this._errors;
}
