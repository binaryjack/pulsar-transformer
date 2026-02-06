/**
 * Validator getRules method
 */

import type { IValidationRule, IValidatorInternal } from '../validator.types.js';

/**
 * Get all validation rules
 */
export function getRules(this: IValidatorInternal): IValidationRule[] {
  return [...this.rules];
}
