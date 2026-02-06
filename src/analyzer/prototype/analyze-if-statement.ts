/**
 * Analyze If Statement
 *
 * Converts if statement AST to IR.
 */

import type { IBlockStatementNode, IIfStatementNode } from '../../parser/ast/index.js';
import { ASTNodeType } from '../../parser/ast/index.js';
import type { IAnalyzerInternal } from '../analyzer.types.js';
import type { IIfStatementIR, IIRNode } from '../ir/index.js';
import { IRNodeType } from '../ir/index.js';

/**
 * Analyze if statement
 */
export function analyzeIfStatement(
  this: IAnalyzerInternal,
  node: IIfStatementNode
): IIfStatementIR {
  // Analyze test condition
  const test = this._analyzeNode(node.test);
  if (!test) {
    throw new Error('If statement test condition cannot be null');
  }

  // Analyze consequent (then branch)
  let consequent: IIRNode | IIRNode[];
  if (node.consequent.type === ASTNodeType.BLOCK_STATEMENT) {
    // Block statement - analyze all body statements
    const block = node.consequent as IBlockStatementNode;
    consequent = [];
    for (const stmt of block.body) {
      const analyzed = this._analyzeNode(stmt);
      if (analyzed) {
        consequent.push(analyzed);
      }
    }
  } else {
    // Single statement
    const analyzed = this._analyzeNode(node.consequent);
    if (!analyzed) {
      throw new Error('If statement consequent cannot be null');
    }
    consequent = analyzed;
  }

  // Analyze alternate (else branch) if present
  let alternate: IIRNode | IIRNode[] | null = null;
  if (node.alternate) {
    if (node.alternate.type === ASTNodeType.BLOCK_STATEMENT) {
      // Block statement - analyze all body statements
      const block = node.alternate as IBlockStatementNode;
      alternate = [];
      for (const stmt of block.body) {
        const analyzed = this._analyzeNode(stmt);
        if (analyzed) {
          alternate.push(analyzed);
        }
      }
    } else {
      // Single statement or else-if
      alternate = this._analyzeNode(node.alternate);
    }
  }

  return {
    type: IRNodeType.IF_STATEMENT_IR,
    test,
    consequent,
    alternate,
    metadata: {
      sourceLocation: node.location?.start,
    },
  };
}
