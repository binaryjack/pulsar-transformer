/**
 * Main Analyze Method
 *
 * Entry point for AST to IR conversion.
 */

import type { IASTNode, IProgramNode } from '../../parser/ast/index.js';
import { ASTNodeType } from '../../parser/ast/index.js';
import type { IAnalyzerInternal } from '../analyzer.types.js';
import type { IIRNode } from '../ir/index.js';
import { IRNodeType } from '../ir/index.js';

/**
 * Analyze AST and build IR
 */
export function analyze(this: IAnalyzerInternal, ast: IASTNode): IIRNode {
  // Reset state
  this._context.scopes = [];
  this._context.currentComponent = null;
  this._context.signals.clear();
  this._context.imports.clear();
  this._context.exports.clear();
  this._errors = [];

  // Analyze root program node
  if (ast.type !== ASTNodeType.PROGRAM) {
    this._addError({
      code: 'PSR-A001',
      message: 'AST root must be a Program node',
      severity: 'error',
    });
    throw new Error('Invalid AST: expected Program node');
  }

  const program = ast as IProgramNode;
  const irNodes: IIRNode[] = [];

  // Analyze each top-level statement
  for (const statement of program.body) {
    const irNode = this._analyzeNode(statement);
    if (irNode) {
      irNodes.push(irNode);
    }
  }

  // Return single node, multiple nodes as ProgramIR, or empty ProgramIR
  if (irNodes.length === 0) {
    return {
      type: IRNodeType.PROGRAM_IR,
      children: [],
      metadata: {},
    } as any;
  } else if (irNodes.length === 1) {
    return irNodes[0];
  } else {
    return {
      type: IRNodeType.PROGRAM_IR,
      children: irNodes,
      metadata: {},
    } as any;
  }
}

/**
 * Analyze a single AST node and convert to IR
 */
function _analyzeNode(this: IAnalyzerInternal, node: IASTNode): IIRNode | null {
  switch (node.type) {
    case ASTNodeType.COMPONENT_DECLARATION:
      return this._analyzeComponent(node);

    case ASTNodeType.VARIABLE_DECLARATION:
      return this._analyzeVariable(node);

    case ASTNodeType.RETURN_STATEMENT:
      return this._analyzeReturn(node);

    case ASTNodeType.IMPORT_DECLARATION:
      return this._analyzeImport(node);

    case ASTNodeType.EXPORT_DECLARATION:
      return this._analyzeExport(node);

    case ASTNodeType.PSR_ELEMENT:
      return this._analyzeElement(node);

    case ASTNodeType.PSR_SIGNAL_BINDING:
      return this._analyzeSignalBinding(node);

    case ASTNodeType.CALL_EXPRESSION:
    case ASTNodeType.LITERAL:
    case ASTNodeType.IDENTIFIER:
    case ASTNodeType.ARROW_FUNCTION:
      return this._analyzeExpression(node);

    default:
      // Unknown node type - skip
      return null;
  }
}

// Export helper
export { _analyzeNode };
