/**
 * S5: Conditional JSX Return Strategy
 *
 * Detects components that conditionally return JSX:
 * - return condition ? <div>A</div> : <div>B</div>
 * - if (x) return <div>A</div>; else return <div>B</div>
 * - return condition && <div>A</div>
 *
 * Confidence: High (conditional JSX is definitive component indicator)
 *
 * @see docs/architecture/transformation-issues/agents/strategy-pattern-agent.md
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Prototype pattern
 */

import * as ts from 'typescript';

import type {
  IConditionalJsxReturnStrategy,
  IDetectionResult,
  IDetectionContext,
} from '../component-detector.types.js';

/**
 * Conditional JSX return detection strategy
 */
export const ConditionalJsxReturnStrategy = function (this: IConditionalJsxReturnStrategy) {
  Object.defineProperty(this, 'name', {
    value: 'ConditionalJsxReturnStrategy',
    writable: false,
    enumerable: true,
    configurable: false,
  });

  Object.defineProperty(this, 'priority', {
    value: 2, // High priority - conditional JSX is strong signal
    writable: false,
    enumerable: true,
    configurable: false,
  });
} as unknown as { new (): IConditionalJsxReturnStrategy };

/**
 * Check if expression contains JSX
 */
function containsJsx(expr: ts.Expression): boolean {
  if (ts.isJsxElement(expr) || ts.isJsxSelfClosingElement(expr) || ts.isJsxFragment(expr)) {
    return true;
  }

  // Check nested expressions
  if (ts.isParenthesizedExpression(expr)) {
    return containsJsx(expr.expression);
  }

  if (ts.isConditionalExpression(expr)) {
    return containsJsx(expr.whenTrue) || containsJsx(expr.whenFalse);
  }

  if (ts.isBinaryExpression(expr)) {
    // && or || operators with JSX
    if (
      expr.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
      expr.operatorToken.kind === ts.SyntaxKind.BarBarToken
    ) {
      return containsJsx(expr.left) || containsJsx(expr.right);
    }
  }

  return false;
}

/**
 * Check if conditionally returns JSX
 */
ConditionalJsxReturnStrategy.prototype.hasConditionalJsxReturn = function (
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
): boolean {
  const body = node.body;
  if (!body) return false;

  // Arrow function with conditional expression: () => x ? <A/> : <B/>
  if (ts.isConditionalExpression(body)) {
    return containsJsx(body);
  }

  // Arrow function with binary expression: () => show && <div/>
  if (ts.isBinaryExpression(body)) {
    return containsJsx(body);
  }

  // Block body: check return statements
  if (ts.isBlock(body)) {
    for (const statement of body.statements) {
      // Return with conditional: return x ? <A/> : <B/>
      if (ts.isReturnStatement(statement) && statement.expression) {
        let expr = statement.expression;

        // Unwrap parenthesized expressions: return (x ? <A/> : <B/>)
        while (ts.isParenthesizedExpression(expr)) {
          expr = expr.expression;
        }

        // Only detect if the return expression itself is conditional
        if (ts.isConditionalExpression(expr) || ts.isBinaryExpression(expr)) {
          if (containsJsx(expr)) {
            return true;
          }
        }
      }

      // If statement with JSX returns
      if (ts.isIfStatement(statement)) {
        const thenHasJsx = checkStatementForJsx(statement.thenStatement);
        const elseHasJsx = statement.elseStatement
          ? checkStatementForJsx(statement.elseStatement)
          : false;

        if (thenHasJsx || elseHasJsx) {
          return true;
        }
      }

      // Switch statement with JSX returns
      if (ts.isSwitchStatement(statement)) {
        for (const caseClause of statement.caseBlock.clauses) {
          for (const stmt of caseClause.statements) {
            if (checkStatementForJsx(stmt)) {
              return true;
            }
          }
        }
      }
    }
  }

  return false;
};

/**
 * Check if statement or block contains JSX return
 */
function checkStatementForJsx(statement: ts.Statement): boolean {
  if (ts.isReturnStatement(statement) && statement.expression) {
    return containsJsx(statement.expression);
  }

  if (ts.isBlock(statement)) {
    for (const stmt of statement.statements) {
      if (checkStatementForJsx(stmt)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Detect component by conditional JSX return
 */
ConditionalJsxReturnStrategy.prototype.detect = function (
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression,
  context: IDetectionContext
): IDetectionResult {
  const hasConditional = this.hasConditionalJsxReturn(node);

  if (!hasConditional) {
    return {
      isComponent: false,
      confidence: 'low',
      strategy: this.name,
      reason: 'No conditional JSX return detected',
    };
  }

  const name = node.name?.getText(context.sourceFile);

  return {
    isComponent: true,
    confidence: 'high',
    strategy: this.name,
    reason: 'Function has conditional JSX return',
    componentName: name,
  };
};
