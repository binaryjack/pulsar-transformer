/**
 * S2: Return Type Strategy
 *
 * Detects components by `: HTMLElement` return type annotation.
 * Confidence: High (explicit type annotation is definitive)
 *
 * @see docs/architecture/transformation-issues/agents/strategy-pattern-agent.md
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype pattern
 */

import * as ts from 'typescript';

import type {
  IReturnTypeStrategy,
  IDetectionResult,
  IDetectionContext,
} from '../component-detector.types.js';

/**
 * Return type detection strategy
 */
export const ReturnTypeStrategy = function (this: IReturnTypeStrategy) {
  Object.defineProperty(this, 'name', {
    value: 'ReturnTypeStrategy',
    writable: false,
    enumerable: true,
    configurable: false,
  });

  Object.defineProperty(this, 'priority', {
    value: 1, // Highest priority - explicit type is definitive
    writable: false,
    enumerable: true,
    configurable: false,
  });
} as unknown as { new (): IReturnTypeStrategy };

/**
 * Check if has HTMLElement return type
 */
ReturnTypeStrategy.prototype.hasHtmlElementReturnType = function (
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
): boolean {
  if (!node.type) return false;

  const typeText = node.type.getText();

  // Direct matches
  if (typeText === 'HTMLElement' || typeText === 'Element' || typeText === 'Node') {
    return true;
  }

  // Union types - check if any part contains HTMLElement/Element/Node
  if (typeText.includes('|')) {
    const parts = typeText.split('|').map((p) => p.trim());
    return parts.some((part) => part === 'HTMLElement' || part === 'Element' || part === 'Node');
  }

  return false;
};

/**
 * Detect component by return type annotation
 */
ReturnTypeStrategy.prototype.detect = function (
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression,
  context: IDetectionContext
): IDetectionResult {
  const hasReturnType = this.hasHtmlElementReturnType(node);

  if (!hasReturnType) {
    return {
      isComponent: false,
      confidence: 'low',
      strategy: this.name,
      reason: 'No HTMLElement return type annotation',
    };
  }

  const name = node.name?.getText(context.sourceFile);
  const returnTypeText = node.type?.getText() || 'HTMLElement';

  return {
    isComponent: true,
    confidence: 'high',
    strategy: this.name,
    reason: `Explicit return type: ${returnTypeText}`,
    componentName: name,
  };
};
