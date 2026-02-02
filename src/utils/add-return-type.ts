/**
 * add-return-type.ts
 * Utility for automatically adding HTMLElement return type to detected components
 *
 * @see docs/architecture/transformation-issues/agents/auto-return-type-agent.md
 * @see .github/01-ARCHITECTURE-PATTERNS.md - Factory pattern
 */

import * as ts from 'typescript';

import type {
  IAddReturnTypeConfig,
  IAddReturnTypeResult,
  IReturnTypeAnalysis,
} from './add-return-type.types.js';

const factory = ts.factory;

/**
 * Analyze node's return type
 */
export function analyzeReturnType(
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression,
  targetType: string = 'HTMLElement'
): IReturnTypeAnalysis {
  const hasReturnType = node.type !== undefined;

  if (!hasReturnType) {
    return {
      hasReturnType: false,
      isCorrectType: false,
    };
  }

  const existingType = node.type!.getText();
  const isCorrectType = existingType === targetType;

  return {
    hasReturnType: true,
    existingType,
    isCorrectType,
    warning: isCorrectType
      ? undefined
      : `Component has return type '${existingType}', expected '${targetType}'`,
  };
}

/**
 * Check if function is async (components cannot be async)
 */
export function isAsyncFunction(
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression
): boolean {
  if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) {
    return node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.AsyncKeyword) ?? false;
  }

  if (ts.isArrowFunction(node)) {
    return node.modifiers?.some((mod) => mod.kind === ts.SyntaxKind.AsyncKeyword) ?? false;
  }

  return false;
}

/**
 * Add return type to function if missing
 *
 * Safety features:
 * - Does NOT override existing return types
 * - Warns if existing type is incorrect
 * - Errors on async functions
 * - Preserves generics
 * - Adds comment flag for transparency
 */
export function addReturnTypeIfMissing(
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression,
  config: IAddReturnTypeConfig = {}
): IAddReturnTypeResult {
  const {
    targetType = 'HTMLElement',
    addCommentFlag = true,
    emitWarnings = true,
    errorOnAsync = true,
  } = config;

  // Check if async (components cannot be async)
  if (errorOnAsync && isAsyncFunction(node)) {
    return {
      node,
      modified: false,
      error: 'Components cannot be async functions',
      hasCommentFlag: false,
    };
  }

  // Analyze existing return type
  const analysis = analyzeReturnType(node, targetType);

  // If has return type, check if correct
  if (analysis.hasReturnType) {
    if (!analysis.isCorrectType && emitWarnings && analysis.warning) {
      console.warn(`[AUTO-TYPE] ${analysis.warning}`);

      return {
        node,
        modified: false,
        warning: analysis.warning,
        hasCommentFlag: false,
      };
    }

    // Already has correct type, no changes needed
    return {
      node,
      modified: false,
      hasCommentFlag: false,
    };
  }

  // Create HTMLElement type reference
  const htmlElementType = factory.createTypeReferenceNode(
    factory.createIdentifier(targetType),
    undefined
  );

  // Clone node with new return type
  let updatedNode: ts.Node;

  if (ts.isFunctionDeclaration(node)) {
    updatedNode = factory.updateFunctionDeclaration(
      node,
      node.modifiers,
      node.asteriskToken,
      node.name,
      node.typeParameters,
      node.parameters,
      htmlElementType, // New return type
      node.body
    );
  } else if (ts.isArrowFunction(node)) {
    updatedNode = factory.updateArrowFunction(
      node,
      node.modifiers,
      node.typeParameters,
      node.parameters,
      htmlElementType, // New return type
      node.equalsGreaterThanToken,
      node.body
    );
  } else if (ts.isFunctionExpression(node)) {
    updatedNode = factory.updateFunctionExpression(
      node,
      node.modifiers,
      node.asteriskToken,
      node.name,
      node.typeParameters,
      node.parameters,
      htmlElementType, // New return type
      node.body
    );
  } else {
    return {
      node,
      modified: false,
      error: 'Unsupported node type',
      hasCommentFlag: false,
    };
  }

  // Add comment flag if requested
  // Note: Comments are handled by the transformer context
  // This flag is informational for the result
  const hasCommentFlag = addCommentFlag;

  // Debug logging if enabled
  if (process.env.DEBUG_TRANSFORMER) {
    const nodeName = node.name?.getText() ?? '<anonymous>';
    console.log(`[AUTO-TYPE] Added HTMLElement return type to ${nodeName}`);
  }

  return {
    node: updatedNode,
    modified: true,
    hasCommentFlag,
  };
}
