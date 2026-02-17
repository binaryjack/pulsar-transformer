/**
 * Transform Block Statement - Transform all statements in block
 */

import type { IBlockStatement } from '../../ast.types.js';
import type { ITransformer } from '../transformer.js';

/**
 * Transform block statement
 * Transform all statements within the block
 */
export function transformBlockStatement(
  this: ITransformer,
  node: IBlockStatement
): IBlockStatement {
  const transformedBody = node.body.map((stmt) => this.transformStatement(stmt));

  return {
    ...node,
    body: transformedBody,
  };
}

