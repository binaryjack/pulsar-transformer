/**
 * Transform Function Declaration - Pass through but transform body
 */

import type { IFunctionDeclaration } from '../../ast.types.js';
import type { ITransformer } from '../transformer.js';

/**
 * Transform function declaration
 * Transform the function body
 */
export function transformFunctionDeclaration(
  this: ITransformer,
  node: IFunctionDeclaration
): IFunctionDeclaration {
  return {
    ...node,
    body: this.transformBlockStatement(node.body),
  };
}

