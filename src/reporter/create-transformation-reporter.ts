/**
 * Create Transformation Reporter - Factory Function
 *
 * Creates a new TransformationReporter instance for collecting
 * and displaying transformation errors and warnings.
 *
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Factory pattern
 *
 * @example
 * ```typescript
 * import { createTransformationReporter } from './create-transformation-reporter';
 *
 * const reporter = createTransformationReporter();
 *
 * reporter.addError({
 *   type: 'UNTRANSFORMED_JSX',
 *   severity: 'error',
 *   location: { file: 'app.tsx', line: 10, column: 5 },
 *   message: 'JSX element not transformed to Pulsar.jsx() call'
 * });
 *
 * if (reporter.hasErrors()) {
 *   reporter.displayErrors();
 * }
 * ```
 */

import './prototype/index.js'; // Ensure prototype methods are attached

import { TransformationReporter } from './transformation-reporter.js';

import type { ITransformationReporter } from './transformation-reporter.types.js';
/**
 * Factory function to create a new TransformationReporter
 *
 * @returns A new TransformationReporter instance
 */
export function createTransformationReporter(): ITransformationReporter {
  return new TransformationReporter() as unknown as ITransformationReporter;
}
