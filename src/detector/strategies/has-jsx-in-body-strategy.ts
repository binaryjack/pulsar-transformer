/**
 * S6: Has JSX in Body Strategy
 *
 * Fallback strategy - detects any JSX usage in function body.
 * Lower confidence because JSX might be passed as prop or used in non-component.
 *
 * Confidence: Low (JSX presence alone doesn't guarantee component)
 *
 * @see docs/architecture/transformation-issues/agents/strategy-pattern-agent.md
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype pattern
 */

import * as ts from 'typescript';

import type {
  IHasJsxInBodyStrategy,
  IDetectionResult,
  IDetectionContext,
} from '../component-detector.types.js';

/**
 * Has JSX in body detection strategy
 */
export const HasJsxInBodyStrategy = function (this: IHasJsxInBodyStrategy) {
  Object.defineProperty(this, 'name', {
    value: 'HasJsxInBodyStrategy',
    writable: false,
    enumerable: true,
    configurable: false,
  });

  Object.defineProperty(this, 'priority', {
    value: 6, // Lowest priority - weakest signal
    writable: false,
    enumerable: true,
    configurable: false,
  });
} as unknown as { new (): IHasJsxInBodyStrategy };

/**
 * Count JSX elements in function body
 */
HasJsxInBodyStrategy.prototype.countJsxElements = function (
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
): number {
  let count = 0;

  const visit = (n: ts.Node): void => {
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) {
      count++;
    }
    ts.forEachChild(n, visit);
  };

  if (node.body) {
    visit(node.body);
  }

  return count;
};

/**
 * Check if has any JSX in function body
 */
HasJsxInBodyStrategy.prototype.hasJsxInBody = function (
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
): boolean {
  return this.countJsxElements(node) > 0;
};

/**
 * Detect component by JSX presence in body
 */
HasJsxInBodyStrategy.prototype.detect = function (
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression,
  context: IDetectionContext
): IDetectionResult {
  const jsxCount = this.countJsxElements(node);
  const hasJsx = jsxCount > 0;

  if (!hasJsx) {
    return {
      isComponent: false,
      confidence: 'low',
      strategy: this.name,
      reason: 'No JSX elements found in body',
    };
  }

  const name = node.name?.getText(context.sourceFile);

  return {
    isComponent: true,
    confidence: 'low', // Low confidence - JSX might be for props
    strategy: this.name,
    reason: `Found ${jsxCount} JSX element(s) in body`,
    componentName: name,
  };
};
