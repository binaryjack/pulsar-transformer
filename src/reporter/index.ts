/**
 * Transformation Reporter - Public API
 *
 * Exports public factory and types for TransformationReporter.
 *
 * @see docs/architecture/transformation-issues/agents/reporter-agent.md
 * @see .github/00-CRITICAL-RULES.md - Export patterns
 */

// Public factory function
export { createTransformationReporter } from './create-transformation-reporter.js';

// Public types
export type {
  ErrorSeverity,
  ErrorType,
  IErrorLocation,
  IDetectionResult,
  ITransformationIssue,
  IValidationResult,
  ITransformationReporter,
} from './transformation-reporter.types.js';
