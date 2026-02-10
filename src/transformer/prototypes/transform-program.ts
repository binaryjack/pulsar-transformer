/**
 * Transform Program - Transform root AST node
 */

import type { IProgramNode } from '../../parser/parser.types.js';
import type { ITransformer } from '../transformer.js';

/**
 * Transform program node
 * Maps over all statements and transforms each one
 */
export function transformProgram(this: ITransformer, node: IProgramNode): IProgramNode {
  const transformedBody = node.body.map((stmt) => this.transformStatement(stmt));

  return {
    ...node,
    body: transformedBody,
  };
}
