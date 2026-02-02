/**
 * Transformation Reporter - Constructor
 *
 * Collects and formats transformation errors and warnings for developer feedback.
 * Uses prototype-based pattern per Pulsar coding standards.
 *
 * @see .github/00-CRITICAL-RULES.md - Prototype-based classes ONLY
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype pattern examples
 */

import type { ITransformationReporterInternal } from './transformation-reporter.types.js';

/**
 * TransformationReporter constructor function
 *
 * Creates a new reporter instance for collecting transformation issues.
 * Internal properties are hidden using Object.defineProperty.
 *
 * @example
 * ```typescript
 * const reporter = new TransformationReporter();
 * reporter.addError({
 *   type: 'UNTRANSFORMED_JSX',
 *   severity: 'error',
 *   location: { file: 'app.tsx', line: 10, column: 5 },
 *   message: 'JSX not transformed'
 * });
 * ```
 */
export const TransformationReporter = function (this: ITransformationReporterInternal) {
  // Private error collection
  Object.defineProperty(this, '_errors', {
    value: [],
    writable: true,
    enumerable: false,
    configurable: false,
  });

  // Private warning collection
  Object.defineProperty(this, '_warnings', {
    value: [],
    writable: true,
    enumerable: false,
    configurable: false,
  });
} as unknown as { new (): ITransformationReporterInternal };
