/**
 * Transformation Reporter - Type Definitions
 *
 * Provides structured error and warning collection for JSX transformation.
 * Used to collect, format, and display transformation issues with actionable suggestions.
 *
 * @module transformation-reporter.types
 */

/**
 * Severity level for transformation issues
 */
export type ErrorSeverity = 'error' | 'warning' | 'info';

/**
 * Specific error types that can occur during transformation
 */
export type ErrorType =
  | 'UNTRANSFORMED_JSX'
  | 'MISSING_RETURN_TYPE'
  | 'COMPONENT_NOT_DETECTED'
  | 'SELF_RECURSION'
  | 'INVALID_PATTERN'
  | 'NAMING_CONVENTION';

/**
 * Location information for an error in source code
 */
export interface IErrorLocation {
  /** File path (relative or absolute) */
  file: string;
  /** Line number (1-indexed) */
  line: number;
  /** Column number (1-indexed) */
  column: number;
}

/**
 * Result from a detection strategy check
 */
export interface IDetectionResult {
  /** Name of the strategy that ran */
  strategy: string;
  /** Whether the strategy passed */
  passed: boolean;
  /** Reason for failure (if passed = false) */
  reason?: string;
}

/**
 * A single transformation issue (error or warning)
 */
export interface ITransformationIssue {
  /** Type of issue */
  type: ErrorType;
  /** Severity level */
  severity: ErrorSeverity;
  /** Component name (if applicable) */
  component?: string;
  /** Location in source code */
  location: IErrorLocation;
  /** Human-readable message */
  message: string;
  /** Suggested fix */
  suggestion?: string;
  /** Code example before fix */
  exampleBefore?: string;
  /** Code example after fix */
  exampleAfter?: string;
  /** Detection strategy results (for debugging) */
  detectionResults?: IDetectionResult[];
}

/**
 * Result of transformation validation
 */
export interface IValidationResult {
  /** Whether validation succeeded (no errors) */
  success: boolean;
  /** List of errors found */
  errors: ITransformationIssue[];
  /** List of warnings found */
  warnings: ITransformationIssue[];
}

/**
 * Internal interface for TransformationReporter implementation
 */
export interface ITransformationReporterInternal {
  /** Internal error collection */
  _errors: ITransformationIssue[];
  /** Internal warning collection */
  _warnings: ITransformationIssue[];

  /** Add an error to the collection */
  addError(issue: ITransformationIssue): void;
  /** Add a warning to the collection */
  addWarning(issue: ITransformationIssue): void;
  /** Check if errors exist */
  hasErrors(): boolean;
  /** Check if warnings exist */
  hasWarnings(): boolean;
  /** Get all errors */
  getErrors(): ITransformationIssue[];
  /** Get all warnings */
  getWarnings(): ITransformationIssue[];
  /** Display errors with beautiful formatting */
  displayErrors(): void;
  /** Display warnings with beautiful formatting */
  displayWarnings(): void;
  /** Clear all errors and warnings */
  clear(): void;
}

/**
 * Public interface for TransformationReporter
 */
export interface ITransformationReporter {
  /** Add an error to the collection */
  addError(issue: ITransformationIssue): void;
  /** Add a warning to the collection */
  addWarning(issue: ITransformationIssue): void;
  /** Check if errors exist */
  hasErrors(): boolean;
  /** Check if warnings exist */
  hasWarnings(): boolean;
  /** Get all errors */
  getErrors(): ITransformationIssue[];
  /** Get all warnings */
  getWarnings(): ITransformationIssue[];
  /** Display errors with beautiful formatting */
  displayErrors(): void;
  /** Display warnings with beautiful formatting */
  displayWarnings(): void;
  /** Clear all errors and warnings */
  clear(): void;
}
