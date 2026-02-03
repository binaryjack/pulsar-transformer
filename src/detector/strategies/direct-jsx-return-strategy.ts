/**
 * S3: Direct JSX Return Strategy
 *
 * Detects components that directly return JSX: `return <div>...</div>`
 * Confidence: High (JSX return is definitive component indicator)
 *
 * @see docs/architecture/transformation-issues/agents/strategy-pattern-agent.md
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype pattern
 */

import * as ts from 'typescript';

import type {
  IDetectionContext,
  IDetectionResult,
  IDirectJsxReturnStrategy,
} from '../component-detector.types.js';

/**
 * Direct JSX return detection strategy
 */
export const DirectJsxReturnStrategy = function (this: IDirectJsxReturnStrategy) {
  Object.defineProperty(this, 'name', {
    value: 'DirectJsxReturnStrategy',
    writable: false,
    enumerable: true,
    configurable: false,
  });

  Object.defineProperty(this, 'priority', {
    value: 2, // High priority - direct JSX is strong signal
    writable: false,
    enumerable: true,
    configurable: false,
  });
} as unknown as { new (): IDirectJsxReturnStrategy };

/**
 * Check if directly returns JSX
 */
DirectJsxReturnStrategy.prototype.hasDirectJsxReturn = function (
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
): boolean {
  const body = node.body;
  if (!body) return false;

  // ⭐ SKIP anonymous arrow functions used as callbacks
  if (ts.isArrowFunction(node)) {
    const parent = node.parent;
    if (
      ts.isCallExpression(parent) ||
      (ts.isParenthesizedExpression(parent) && ts.isCallExpression(parent.parent))
    ) {
      // This is a callback like runTest('test', () => <Component />)
      return false;
    }
  }

  // Arrow function with expression body: () => <div>
  if (ts.isJsxElement(body) || ts.isJsxSelfClosingElement(body) || ts.isJsxFragment(body)) {
    return true;
  }

  // Block body: check return statements
  if (ts.isBlock(body)) {
    for (const statement of body.statements) {
      if (ts.isReturnStatement(statement) && statement.expression) {
        let expr = statement.expression;

        // Unwrap parenthesized expressions: return (<JSX>)
        while (ts.isParenthesizedExpression(expr)) {
          expr = expr.expression;
        }

        if (ts.isJsxElement(expr) || ts.isJsxSelfClosingElement(expr) || ts.isJsxFragment(expr)) {
          return true;
        }
      }
    }
  }

  return false;
};

/**
 * Detect component by direct JSX return
 */
DirectJsxReturnStrategy.prototype.detect = function (
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression,
  context: IDetectionContext
): IDetectionResult {
  const hasDirect = this.hasDirectJsxReturn(node);

  if (!hasDirect) {
    return {
      isComponent: false,
      confidence: 'low',
      strategy: this.name,
      reason: 'No direct JSX return statement',
    };
  }

  const name = node.name?.getText(context.sourceFile);

  return {
    isComponent: true,
    confidence: 'high',
    strategy: this.name,
    reason: 'Function has direct JSX return',
    componentName: name,
  };
};
