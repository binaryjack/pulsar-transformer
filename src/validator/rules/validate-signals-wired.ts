/**
 * Signal Wiring Validation Rule
 *
 * Detects missing wire() calls for reactive expressions.
 */

import type { IValidationContext, IValidationIssue, IValidationRule } from '../validator.types.js';

/**
 * Validate that reactive signals are properly wired
 */
export const validateSignalsWired: IValidationRule = {
  name: 'signals-wired',
  description: 'Ensures reactive signal calls are wrapped with wire()',

  validate(code: string, context?: IValidationContext): IValidationIssue[] {
    const issues: IValidationIssue[] = [];

    // Pattern: signal() calls without wire() wrapper
    // This is a heuristic - look for signal patterns that aren't in wire() context
    const signalCallPattern = /(\w+)\(\)/g;
    let match: RegExpExecArray | null;

    const lines = code.split('\n');

    lines.forEach((line, index) => {
      // Skip lines that already have wire()
      if (line.includes('wire(') || line.includes('$REGISTRY.wire(')) {
        return;
      }

      // Skip variable declarations and function definitions
      if (line.includes('const ') || line.includes('let ') || line.includes('function ')) {
        return;
      }

      // Look for potential signal calls in assignments or expressions
      if ((line.includes('=') || line.includes('textContent')) && signalCallPattern.test(line)) {
        // This is a potential unwired signal usage
        // Only warn, not error, as this is heuristic
        issues.push({
          type: 'MISSING_WIRE',
          severity: 'warning',
          message: `Potential unwired reactive signal on line ${index + 1}`,
          location: { line: index + 1 },
          snippet: line.trim(),
          fix: 'Consider wrapping reactive expressions with $REGISTRY.wire()',
        });
      }
    });

    return issues;
  },
};
