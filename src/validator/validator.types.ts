/**
 * Validator Type Definitions
 *
 * Types for transformation output validation.
 */

/**
 * Validation issue severity
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Validation issue type
 */
export type ValidationIssueType =
  | 'UNTRANSFORMED_JSX'
  | 'MISSING_IMPORT'
  | 'INVALID_SYNTAX'
  | 'MISSING_WIRE'
  | 'INCOMPLETE_TRANSFORMATION';

/**
 * Public Validator interface
 */
export interface IValidator {
  /**
   * Validate transformed output code
   */
  validate(code: string, context?: IValidationContext): IValidationResult;

  /**
   * Add a custom validation rule
   */
  addRule(rule: IValidationRule): void;

  /**
   * Get all validation rules
   */
  getRules(): IValidationRule[];
}

/**
 * Internal Validator interface
 */
export interface IValidatorInternal extends IValidator {
  config: IValidatorConfig;
  rules: IValidationRule[];
}

/**
 * Validator configuration
 */
export interface IValidatorConfig {
  /**
   * Enable validation
   */
  enabled: boolean;

  /**
   * Fail on warnings
   */
  strict: boolean;

  /**
   * Custom validation rules
   */
  customRules?: IValidationRule[];
}

/**
 * Validation context
 */
export interface IValidationContext {
  /**
   * Source file path
   */
  sourceFile?: string;

  /**
   * Original source code
   */
  originalCode?: string;

  /**
   * Transformation phase
   */
  phase?: string;
}

/**
 * Validation result
 */
export interface IValidationResult {
  /**
   * Validation passed
   */
  valid: boolean;

  /**
   * Validation issues found
   */
  issues: IValidationIssue[];

  /**
   * Number of errors
   */
  errorCount: number;

  /**
   * Number of warnings
   */
  warningCount: number;
}

/**
 * Validation issue
 */
export interface IValidationIssue {
  /**
   * Issue type
   */
  type: ValidationIssueType;

  /**
   * Issue severity
   */
  severity: ValidationSeverity;

  /**
   * Issue message
   */
  message: string;

  /**
   * Location in code (optional)
   */
  location?: {
    line?: number;
    column?: number;
    offset?: number;
  };

  /**
   * Code snippet (optional)
   */
  snippet?: string;

  /**
   * Suggested fix (optional)
   */
  fix?: string;
}

/**
 * Validation rule
 */
export interface IValidationRule {
  /**
   * Rule name
   */
  name: string;

  /**
   * Rule description
   */
  description: string;

  /**
   * Rule validation function
   */
  validate: (code: string, context?: IValidationContext) => IValidationIssue[];
}
