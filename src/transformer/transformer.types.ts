/**
 * Transformer Type Definitions
 * Context, results, and error types for AST transformation
 */

import type { IASTNode, IProgramNode } from '../parser/parser.types.js';

/**
 * Transform context - shared state during transformation
 */
export interface ITransformContext {
  sourceFile: string;
  usedImports: Set<string>;
  errors: ITransformError[];
}

/**
 * Transform error
 */
export interface ITransformError {
  type: string;
  message: string;
  node: IASTNode;
}

/**
 * Transform result
 */
export interface ITransformResult {
  ast: IProgramNode;
  context: ITransformContext;
}
