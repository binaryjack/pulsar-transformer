/**
 * JSX Transformation Validation Rule
 *
 * Detects untransformed JSX in output code.
 */

import type { IValidationContext, IValidationIssue, IValidationRule } from '../validator.types.js';

/**
 * Validate that JSX has been properly transformed
 */
export const validateJsxTransformed: IValidationRule = {
  name: 'jsx-transformed',
  description: 'Ensures JSX syntax has been transformed to DOM calls',

  validate(code: string, context?: IValidationContext): IValidationIssue[] {
    const issues: IValidationIssue[] = [];

    // Pattern 1: JSX opening tags with capital letters (components)
    const componentJsxPattern = /<[A-Z]\w*[\s>]/g;
    let match: RegExpExecArray | null;

    while ((match = componentJsxPattern.exec(code)) !== null) {
      // Check if this is in a string or comment
      const beforeMatch = code.substring(0, match.index);
      const inString = (beforeMatch.match(/"/g) || []).length % 2 !== 0;
      const inComment = beforeMatch.lastIndexOf('//') > beforeMatch.lastIndexOf('\n');

      if (!inString && !inComment) {
        issues.push({
          type: 'UNTRANSFORMED_JSX',
          severity: 'error',
          message: `Untransformed JSX component detected: ${match[0].trim()}`,
          snippet: code.substring(Math.max(0, match.index - 20), match.index + 40),
        });
      }
    }

    // Pattern 2: JSX self-closing tags
    const selfClosingPattern = /<[A-Z]\w*\s*\/>/g;

    while ((match = selfClosingPattern.exec(code)) !== null) {
      const beforeMatch = code.substring(0, match.index);
      const inString = (beforeMatch.match(/"/g) || []).length % 2 !== 0;

      if (!inString) {
        issues.push({
          type: 'UNTRANSFORMED_JSX',
          severity: 'error',
          message: `Untransformed self-closing JSX detected: ${match[0]}`,
          snippet: code.substring(Math.max(0, match.index - 20), match.index + 40),
        });
      }
    }

    // Pattern 3: Check for React usage without import (common sign of JSX issues)
    if (code.includes('React.') && !code.includes('import React')) {
      issues.push({
        type: 'MISSING_IMPORT',
        severity: 'error',
        message: 'React usage detected but React is not imported',
        fix: "Add: import React from 'react'; or ensure JSX is fully transformed",
      });
    }

    return issues;
  },
};
