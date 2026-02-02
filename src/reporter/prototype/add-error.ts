/**
 * TransformationReporter.addError() - Prototype Method
 *
 * Adds an error to the reporter's error collection.
 *
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype method pattern
 */

import type {
  ITransformationReporterInternal,
  ITransformationIssue,
} from '../transformation-reporter.types.js';

/**
 * Add an error to the collection
 *
 * @param issue - The transformation issue to add
 */
export function addError(this: ITransformationReporterInternal, issue: ITransformationIssue): void {
  this._errors.push(issue);
}
