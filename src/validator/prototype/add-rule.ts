/**
 * Validator addRule method
 */

import type { IValidationRule, IValidatorInternal } from '../validator.types.js';

/**
 * Add a custom validation rule
 */
export function addRule(this: IValidatorInternal, rule: IValidationRule): void {
  this.rules.push(rule);
}
