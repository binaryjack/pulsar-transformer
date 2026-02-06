/**
 * Validator Factory
 *
 * Creates validator instances with default configuration.
 */

import './prototype/index.js';
import { Validator } from './validator.js';
import type { IValidator, IValidatorConfig } from './validator.types.js';

/**
 * Create a validator instance
 */
export function createValidator(config?: Partial<IValidatorConfig>): IValidator {
  const defaultConfig: IValidatorConfig = {
    enabled: true,
    strict: false,
  };

  const finalConfig: IValidatorConfig = {
    ...defaultConfig,
    ...config,
  };

  return new Validator(finalConfig);
}
