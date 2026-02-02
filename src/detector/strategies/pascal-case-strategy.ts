/**
 * S1: PascalCase Strategy
 *
 * Detects components by PascalCase naming convention.
 * Confidence: Medium (naming convention is strong signal but not definitive)
 *
 * @see docs/architecture/transformation-issues/agents/strategy-pattern-agent.md
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype pattern
 */

import type * as ts from 'typescript';
import type {
  IPascalCaseStrategy,
  IDetectionResult,
  IDetectionContext,
} from '../component-detector.types.js';

/**
 * PascalCase detection strategy
 */
export const PascalCaseStrategy = function (this: IPascalCaseStrategy) {
  Object.defineProperty(this, 'name', {
    value: 'PascalCaseStrategy',
    writable: false,
    enumerable: true,
    configurable: false,
  });

  Object.defineProperty(this, 'priority', {
    value: 3,
    writable: false,
    enumerable: true,
    configurable: false,
  });
} as unknown as { new (): IPascalCaseStrategy };

/**
 * Check if name is PascalCase
 */
PascalCaseStrategy.prototype.isPascalCase = function (name: string): boolean {
  if (!name || name.length === 0) return false;

  // Must not start with underscore or number
  if (/^[_0-9]/.test(name)) return false;

  // Must start with uppercase letter
  if (name[0] !== name[0].toUpperCase()) return false;

  // Single uppercase letter is valid (e.g., 'A')
  if (name.length === 1) return true;

  // Must not be all uppercase (that's CONSTANT_CASE)
  if (name === name.toUpperCase()) return false;

  // Valid PascalCase
  return true;
};

/**
 * Detect component by PascalCase naming
 */
PascalCaseStrategy.prototype.detect = function (
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression,
  context: IDetectionContext
): IDetectionResult {
  const name = node.name?.getText(context.sourceFile);

  if (!name) {
    return {
      isComponent: false,
      confidence: 'low',
      strategy: this.name,
      reason: 'No function name',
    };
  }

  const isPascal = this.isPascalCase(name);

  return {
    isComponent: isPascal,
    confidence: isPascal ? 'medium' : 'low',
    strategy: this.name,
    reason: isPascal ? `PascalCase naming: ${name}` : `not PascalCase: ${name}`,
    componentName: isPascal ? name : undefined,
  };
};
