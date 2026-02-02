/**
 * S4: Variable JSX Return Strategy ⭐ THE BIG FIX ⭐
 *
 * Detects pattern: const el = <JSX>; return el;
 *
 * This is THE ROOT CAUSE of infinite loops in transformer.
 * Previous implementation only checked direct returns, missing this pattern.
 *
 * Example that causes infinite loops:
 * ```typescript
 * const MyButton = () => {
 *   const button = <button>Click</button>;
 *   return button;
 * }
 * ```
 *
 * Confidence: High (JSX assignment + identifier return is definitive)
 *
 * @see docs/architecture/transformation-issues/01-CRITICAL-ISSUES.md - Issue #1
 * @see docs/architecture/transformation-issues/agents/strategy-pattern-agent.md
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype pattern
 */

import * as ts from 'typescript';

import { addReturnTypeIfMissing } from '../../utils/add-return-type.js';

import type {
  IDetectionContext,
  IDetectionResult,
  IVariableJsxReturnStrategy,
} from '../component-detector.types.js';

/**
 * Variable JSX return detection strategy
 */
export const VariableJsxReturnStrategy = function (this: IVariableJsxReturnStrategy) {
  Object.defineProperty(this, 'name', {
    value: 'VariableJsxReturnStrategy',
    writable: false,
    enumerable: true,
    configurable: false,
  });

  Object.defineProperty(this, 'priority', {
    value: 2, // High priority - this is THE FIX
    writable: false,
    enumerable: true,
    configurable: false,
  });
} as unknown as { new (): IVariableJsxReturnStrategy };

/**
 * Extract variable name from JSX assignment
 */
VariableJsxReturnStrategy.prototype.getJsxVariableName = function (
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
): string | undefined {
  const body = node.body;
  if (!body || !ts.isBlock(body)) return undefined;

  // Find variable declarations with JSX initializers
  for (const statement of body.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (declaration.initializer) {
          let init = declaration.initializer;

          // Unwrap parenthesized expressions: const x = (<JSX>)
          while (ts.isParenthesizedExpression(init)) {
            init = init.expression;
          }

          if (ts.isJsxElement(init) || ts.isJsxSelfClosingElement(init) || ts.isJsxFragment(init)) {
            // Found JSX assignment
            if (ts.isIdentifier(declaration.name)) {
              return declaration.name.text;
            }
          }
        }
      }
    }
  }

  return undefined;
};

/**
 * Check if assigns JSX to variable then returns it
 *
 * Pattern detection:
 * 1. Find variable declaration: const x = <JSX>
 * 2. Find return statement: return x
 * 3. Verify x matches the JSX variable
 */
VariableJsxReturnStrategy.prototype.hasVariableJsxReturn = function (
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
): boolean {
  const jsxVarName = this.getJsxVariableName(node);
  if (!jsxVarName) return false;

  const body = node.body;
  if (!body || !ts.isBlock(body)) return false;

  // Check if any return statement returns the JSX variable
  for (const statement of body.statements) {
    if (ts.isReturnStatement(statement) && statement.expression) {
      // Direct identifier return: return el
      if (ts.isIdentifier(statement.expression)) {
        if (statement.expression.text === jsxVarName) {
          return true;
        }
      }

      // Parenthesized return: return (el)
      if (ts.isParenthesizedExpression(statement.expression)) {
        const inner = statement.expression.expression;
        if (ts.isIdentifier(inner) && inner.text === jsxVarName) {
          return true;
        }
      }
    }
  }

  return false;
};

/**
 * Detect component by variable JSX return pattern
 *
 * IMPROVEMENT: Automatically adds `: HTMLElement` return type if missing
 * to prevent TypeScript inference issues.
 */
VariableJsxReturnStrategy.prototype.detect = function (
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression,
  context: IDetectionContext
): IDetectionResult {
  const hasPattern = this.hasVariableJsxReturn(node);

  if (!hasPattern) {
    return {
      isComponent: false,
      confidence: 'low',
      strategy: this.name,
      reason: 'No variable JSX return pattern detected',
    };
  }

  const name = node.name?.getText(context.sourceFile);
  const jsxVarName = this.getJsxVariableName(node);

  // Auto-add return type if missing (Phase 1C integration)
  if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) {
    const result = addReturnTypeIfMissing(node, {
      targetType: 'HTMLElement',
      addCommentFlag: true,
      emitWarnings: context.debug ?? false,
      errorOnAsync: false,
    });

    if (context.debug && result.modified) {
      console.log(
        `[VariableJsxReturnStrategy] Auto-added ': HTMLElement' to ${name || 'anonymous'}`
      );
    }
  }

  return {
    isComponent: true,
    confidence: 'high',
    strategy: this.name,
    reason: `Variable JSX pattern: const ${jsxVarName} = <JSX>; return ${jsxVarName}`,
    componentName: name,
  };
};
