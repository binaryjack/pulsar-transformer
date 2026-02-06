/**
 * Validator Constructor
 *
 * Prototype-based validator for transformation output.
 */

import type { IValidatorConfig, IValidatorInternal } from './validator.types.js';

/**
 * Validator constructor function
 */
export const Validator = function (this: IValidatorInternal, config: IValidatorConfig) {
  // Store configuration
  Object.defineProperty(this, 'config', {
    value: config,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  // Initialize rules array
  Object.defineProperty(this, 'rules', {
    value: config.customRules || [],
    writable: true,
    enumerable: false,
    configurable: false,
  });
} as unknown as { new (config: IValidatorConfig): IValidatorInternal };
