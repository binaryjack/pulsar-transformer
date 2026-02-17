/**
 * Transform Variable Declaration - Pass through but transform initializer
 */

import type { IVariableDeclaration } from '../../ast.types.js';
import type { ITransformer } from '../transformer.js';

/**
 * Transform variable declaration
 * Transform the initializer expression if present
 */
export function transformVariableDeclaration(
  this: ITransformer,
  node: IVariableDeclaration
): IVariableDeclaration {
  // Transform initializers for each declarator
  const transformedDeclarations = node.declarations.map((declarator) => {
    if (declarator.init) {
      return {
        ...declarator,
        init: this.transformExpression(declarator.init),
      };
    }
    return declarator;
  });

  return {
    ...node,
    declarations: transformedDeclarations,
  };
}

