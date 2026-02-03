/**
 * Analyze Return Statement
 * 
 * Converts return statement AST to IR.
 */

import type { IAnalyzerInternal } from '../analyzer.types';
import type { IReturnStatementNode } from '../../parser/ast';
import type { IReturnStatementIR } from '../ir';
import { IRNodeType } from '../ir';

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
