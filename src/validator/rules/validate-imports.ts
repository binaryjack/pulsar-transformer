/**
 * Import Completeness Validation Rule
 *
 * Detects missing imports for Pulsar runtime functions.
 */

import type { IValidationContext, IValidationIssue, IValidationRule } from '../validator.types.js';

/**
 * Validate that required imports are present
 */
export const validateImports: IValidationRule = {
  name: 'imports-complete',
  description: 'Ensures all required Pulsar imports are present',

  validate(code: string, context?: IValidationContext): IValidationIssue[] {
    const issues: IValidationIssue[] = [];

    // Check for $REGISTRY usage without import
    if (code.includes('$REGISTRY') && !code.includes("from '@pulsar")) {
      issues.push({
        type: 'MISSING_IMPORT',
        severity: 'error',
        message: '$REGISTRY used but Pulsar runtime not imported',
        fix: "Add: import { $REGISTRY } from '@pulsar-framework/runtime';",
      });
    }

    // Check for createSignal usage without import
    if (
      code.includes('createSignal(') &&
      !code.includes('import') &&
      !code.includes('createSignal')
    ) {
      issues.push({
        type: 'MISSING_IMPORT',
        severity: 'error',
        message: 'createSignal used but not imported',
        fix: "Add: import { createSignal } from '@pulsar-framework/runtime';",
      });
    }

    // Check for t_element usage without proper setup
    if (code.includes('t_element(') && !code.includes("from '@pulsar")) {
      issues.push({
        type: 'MISSING_IMPORT',
        severity: 'error',
        message: 't_element used but Pulsar runtime not imported',
        fix: "Add: import { t_element } from '@pulsar-framework/runtime';",
      });
    }

    return issues;
  },
};
