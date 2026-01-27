import * as ts from 'typescript';
import { IJSXAnalyzer } from '../jsx-analyzer.types.js';

/**
 * Determines if an expression is static (literal value or component prop/parameter)
 *
 * Static expressions don't need to be wrapped in createEffect because:
 * 1. Literals never change
 * 2. Props/parameters are set once when component is called and don't change reactively
 *    (if the parent needs to update the prop, it recreates the component)
 */
export const isStaticValue = function (this: IJSXAnalyzer, expr: ts.Expression): boolean {
  // Literals are static
  if (
    ts.isStringLiteral(expr) ||
    ts.isNumericLiteral(expr) ||
    expr.kind === ts.SyntaxKind.TrueKeyword ||
    expr.kind === ts.SyntaxKind.FalseKeyword ||
    expr.kind === ts.SyntaxKind.NullKeyword
  ) {
    return true;
  }

  // Identifiers that are function parameters (props) are also static
  // because they don't reactively update within the component's lifetime
  if (ts.isIdentifier(expr)) {
    // Common prop names that should be treated as static
    const staticPropNames = ['children', 'props'];
    return staticPropNames.includes(expr.text);
  }

  return false;
};
