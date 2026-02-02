/**
 * TransformationReporter.addWarning() - Prototype Method
 *
 * Adds a warning to the reporter's warning collection.
 *
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype method pattern
 */

import type {
  ITransformationReporterInternal,
  ITransformationIssue,
} from '../transformation-reporter.types.js';

/**
 * Add a warning to the collection
 *
 * @param issue - The transformation issue to add
 */
export function addWarning(
  this: ITransformationReporterInternal,
  issue: ITransformationIssue
): void {
  this._warnings.push(issue);
}
