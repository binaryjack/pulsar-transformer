/**
 * Provider Detector Utility
 * Analyzes components to determine if they use/wrap Context.Provider
 */

import * as ts from 'typescript';

/**
 * Check if a component uses/wraps Context.Provider
 * Used to determine if children should be deferred (passed as functions)
 *
 * Patterns detected:
 * 1. Direct Context.Provider (e.g., FormContext.Provider)
 * 2. Component name ends with "Provider" (e.g., FormProvider, AppContextProvider)
 */
export function componentUsesProvider(
  componentExpr: ts.Expression,
  typeChecker: ts.TypeChecker,
  sourceFile: ts.SourceFile
): boolean {
  // Pattern 1: Direct Context.Provider (e.g., FormContext.Provider)
  if (ts.isPropertyAccessExpression(componentExpr) && componentExpr.name.text === 'Provider') {
    return true;
  }

  // Pattern 2: Component name ends with "Provider"
  if (ts.isIdentifier(componentExpr) && componentExpr.text.endsWith('Provider')) {
    // Try to find the component declaration in the source file
    const symbol = typeChecker.getSymbolAtLocation(componentExpr);
    if (symbol && symbol.declarations && symbol.declarations.length > 0) {
      const declaration = symbol.declarations[0];

      // Check if it's a function/arrow function component
      if (
        ts.isFunctionDeclaration(declaration) ||
        ts.isVariableDeclaration(declaration) ||
        ts.isArrowFunction(declaration)
      ) {
        // Check the function body for Context.Provider usage
        const body = getFunctionBody(declaration);

        if (body) {
          return hasProviderInBody(body);
        }
      }
    }

    // Fallback: If we can't analyze the body, defer children for safety
    // Any component ending with "Provider" likely needs deferred children
    return true;
  }

  return false;
}

/**
 * Extract function body from different declaration types
 */
function getFunctionBody(declaration: ts.Node): ts.Node | null {
  if (ts.isFunctionDeclaration(declaration)) {
    return declaration.body || null;
  }

  if (
    ts.isVariableDeclaration(declaration) &&
    declaration.initializer &&
    ts.isArrowFunction(declaration.initializer)
  ) {
    return declaration.initializer.body;
  }

  if (ts.isArrowFunction(declaration)) {
    return declaration.body;
  }

  return null;
}

/**
 * Check if function body contains Context.Provider usage
 */
function hasProviderInBody(body: ts.Node): boolean {
  let hasProvider = false;

  const visitNode = (node: ts.Node): void => {
    // Check return statements for Provider
    if (ts.isReturnStatement(node) && node.expression) {
      checkForProvider(node.expression);
    }

    // Continue traversing
    ts.forEachChild(node, visitNode);
  };

  const checkForProvider = (expr: ts.Node): void => {
    // Check JSX elements for .Provider
    if (ts.isJsxElement(expr)) {
      const tagName = expr.openingElement.tagName;
      if (ts.isPropertyAccessExpression(tagName) && tagName.name.text === 'Provider') {
        hasProvider = true;
      }
    }

    // Check self-closing JSX elements
    if (ts.isJsxSelfClosingElement(expr) && ts.isPropertyAccessExpression(expr.tagName)) {
      if (expr.tagName.name.text === 'Provider') {
        hasProvider = true;
      }
    }

    // Continue checking children
    ts.forEachChild(expr, checkForProvider);
  };

  visitNode(body);
  return hasProvider;
}

/**
 * Check if a component name suggests it's a provider
 * Used as a fast heuristic without deep analysis
 */
export function isProviderByName(componentName: string): boolean {
  return componentName.endsWith('Provider');
}
