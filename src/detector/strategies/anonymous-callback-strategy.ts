/**
 * S7: Anonymous Callback Strategy
 *
 * NEGATIVE strategy: Detects anonymous arrow functions used as callbacks that should NOT be treated as components.
 * These are functions passed as arguments to other functions (like runTest, map, etc).
 * Confidence: High (prevents false positives)
 *
 * Example:
 * runTest('test', () => <Component />) // NOT a component - it's a callback
 *
 * @see docs/architecture/transformation-issues/agents/strategy-pattern-agent.md
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype pattern
 */

import * as ts from 'typescript';

import type {
  IAnonymousCallbackStrategy,
  IDetectionContext,
  IDetectionResult,
} from '../component-detector.types.js';

/**
 * Anonymous callback detection strategy (NEGATIVE)
 */
export const AnonymousCallbackStrategy = function (this: IAnonymousCallbackStrategy) {
  Object.defineProperty(this, 'name', {
    value: 'AnonymousCallbackStrategy',
    writable: false,
    enumerable: true,
    configurable: false,
  });

  Object.defineProperty(this, 'priority', {
    value: 0, // HIGHEST priority - prevent false positives
    writable: false,
    enumerable: true,
    configurable: false,
  });
} as unknown as { new (): IAnonymousCallbackStrategy };

/**
 * Check if node is an anonymous callback
 */
AnonymousCallbackStrategy.prototype.isAnonymousCallback = function (
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression,
  context: IDetectionContext
): boolean {
  // Only arrow functions can be anonymous callbacks
  if (!ts.isArrowFunction(node)) {
    return false;
  }

  // Check if this arrow function is inside a CallExpression
  const parent = node.parent;

  // Direct parent is CallExpression argument
  if (ts.isCallExpression(parent)) {
    return true;
  }

  // Parent might be parenthesized expression, then CallExpression
  if (ts.isParenthesizedExpression(parent) && ts.isCallExpression(parent.parent)) {
    return true;
  }

  // Parent might be array literal element (like in map())
  if (ts.isArrayLiteralExpression(parent)) {
    return true;
  }

  // Parent might be object literal property
  if (ts.isPropertyAssignment(parent)) {
    return true;
  }

  return false;
};

/**
 * Detect component by checking if it's NOT an anonymous callback
 */
AnonymousCallbackStrategy.prototype.detect = function (
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression,
  context: IDetectionContext
): IDetectionResult {
  const isCallback = this.isAnonymousCallback(node, context);

  if (isCallback) {
    // This is a callback, NOT a component
    return {
      isComponent: false,
      confidence: 'high',
      strategy: this.name,
      reason: 'Anonymous arrow function used as callback argument - not a component definition',
    };
  }

  // Not a callback - let other strategies decide
  return {
    isComponent: false,
    confidence: 'low',
    strategy: this.name,
    reason: 'Not an anonymous callback - other strategies should determine component status',
  };
};
