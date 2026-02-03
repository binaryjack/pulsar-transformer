/**
 * Analyze Return Statement
 *
 * Converts return statement AST to IR.
 */

import type { IReturnStatementNode } from '../../parser/ast/index.js';
import type { IAnalyzerInternal } from '../analyzer.types.js';
import type { IReturnStatementIR } from '../ir/index.js';
import { IRNodeType } from '../ir/index.js';

/**
 * Analyze return statement
 */
export function analyzeReturn(
  this: IAnalyzerInternal,
  node: IReturnStatementNode
): IReturnStatementIR {
  const argument = node.argument ? this._analyzeNode(node.argument) : null;

  return {
    type: IRNodeType.RETURN_STATEMENT_IR,
    argument,
    metadata: {
      sourceLocation: node.location?.start,
    },
  };
}
