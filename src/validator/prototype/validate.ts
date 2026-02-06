/**
 * Validator validate method
 */

import { validateImports } from '../rules/validate-imports.js';
import { validateJsxTransformed } from '../rules/validate-jsx-transformed.js';
import { validateSignalsWired } from '../rules/validate-signals-wired.js';
import type {
  IValidationContext,
  IValidationResult,
  IValidatorInternal,
} from '../validator.types.js';

/**
 * Validate transformed output code
 */
export function validate(
  this: IValidatorInternal,
  code: string,
  context?: IValidationContext
): IValidationResult {
  if (!this.config.enabled) {
    return {
      valid: true,
      issues: [],
      errorCount: 0,
      warningCount: 0,
    };
  }

  // Default validation rules
  const defaultRules = [validateJsxTransformed, validateImports, validateSignalsWired];

  // Combine with custom rules
  const allRules = [...defaultRules, ...this.rules];

  // Run all validation rules
  const allIssues = allRules.flatMap((rule) => rule.validate(code, context));

  // Count errors and warnings
  const errorCount = allIssues.filter((i) => i.severity === 'error').length;
  const warningCount = allIssues.filter((i) => i.severity === 'warning').length;

  // Determine validity
  const valid = this.config.strict ? errorCount === 0 && warningCount === 0 : errorCount === 0;

  return {
    valid,
    issues: allIssues,
    errorCount,
    warningCount,
  };
}
