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
  this._context._recursionDepth = 0;
  this._context._iterationCount = 0;
  this._context._currentNode = 'root';

  if (this._context.logger) {
    this._context.logger.log('analyzer', 'info', 'Starting analysis', {
      astType: ast.type,
      maxIterations: this._context._maxIterations,
    });
  }

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

  if (this._context.logger) {
    this._context.logger.log('analyzer', 'debug', `Analyzing ${program.body.length} statements`, {
      statementCount: program.body.length,
    });
  }

  // Analyze each statement and build IR nodes
  for (let i = 0; i < program.body.length; i++) {
    const statement = program.body[i];
    if (this._context.logger) {
      this._context.logger.log(
        'analyzer',
        'trace',
        `Analyzing statement ${i + 1}/${program.body.length}`,
        {
          statementType: statement?.type,
          index: i,
        }
      );
    }

    const irNode = this._analyzeNode(statement);
    if (irNode) {
      irNodes.push(irNode);
    }
  }

  if (this._context.logger) {
    this._context.logger.log('analyzer', 'info', 'Analysis complete', {
      irNodeCount: irNodes.length,
      totalIterations: this._context._iterationCount,
    });
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
  // Guard against null/undefined nodes
  if (!node || !node.type) {
    return null;
  }

  // Increment iteration counter and depth
  if (this._context._iterationCount !== undefined) {
    this._context._iterationCount++;
  }
  if (this._context._recursionDepth !== undefined) {
    this._context._recursionDepth++;
  }

  // Safety check for infinite loops
  if (
    this._context._iterationCount !== undefined &&
    this._context._maxIterations !== undefined &&
    this._context._iterationCount > this._context._maxIterations
  ) {
    const error = new Error(
      `[ANALYZER] Exceeded maximum iterations (${this._context._maxIterations}). ` +
        `Last node: ${this._context._currentNode} (${node.type}). ` +
        `Depth: ${this._context._recursionDepth}. ` +
        `Component: ${this._context.currentComponent || 'none'}. ` +
        `Possible infinite loop detected.`
    );
    if (this._context.logger) {
      this._context.logger.error('analyzer', 'Iteration limit exceeded', error as Error, {
        iterationCount: this._context._iterationCount,
        depth: this._context._recursionDepth,
        nodeType: node.type,
        currentNode: this._context._currentNode,
        component: this._context.currentComponent,
      });
    }
    throw error;
  }

  // Log every 100 iterations
  if (
    this._context.logger &&
    this._context._iterationCount !== undefined &&
    this._context._iterationCount % 100 === 0
  ) {
    this._context.logger.log(
      'analyzer',
      'debug',
      `Progress: ${this._context._iterationCount} iterations`,
      {
        depth: this._context._recursionDepth,
        nodeType: node.type,
        component: this._context.currentComponent,
      }
    );
  }

  // Store current node for debugging
  this._context._currentNode = `${node.type}${(node as any).name ? `:${(node as any).name}` : ''}`;

  switch (node.type) {
    case ASTNodeType.COMPONENT_DECLARATION:
      return this._analyzeComponent(node);

    case ASTNodeType.VARIABLE_DECLARATION:
      return this._analyzeVariable(node);

    case ASTNodeType.RETURN_STATEMENT:
      return this._analyzeReturn(node);

    case ASTNodeType.IF_STATEMENT:
      return this._analyzeIfStatement(node);

    case ASTNodeType.BLOCK_STATEMENT:
      // Block statements are handled by analyzing their body statements
      // Return null for the block itself, as its statements are processed inline
      return null;

    case ASTNodeType.EXPRESSION_STATEMENT:
      // Expression statements (console.log, createEffect, etc.) - analyze the inner expression
      return this._analyzeExpression((node as any).expression);

    case ASTNodeType.IMPORT_DECLARATION:
      return this._analyzeImport(node);

    case ASTNodeType.EXPORT_DECLARATION:
      return this._analyzeExport(node);

    case ASTNodeType.PSR_ELEMENT:
      return this._analyzeElement(node);

    case ASTNodeType.PSR_COMPONENT_REFERENCE:
      return this._analyzeComponentReference(node);

    case ASTNodeType.PSR_SIGNAL_BINDING:
      return this._analyzeSignalBinding(node);

    case ASTNodeType.PSR_TEXT_NODE:
      // Convert text node to literal IR
      return {
        type: 'LiteralIR',
        value: (node as any).value,
        raw: `"${(node as any).value}"`,
      } as any;

    case ASTNodeType.CALL_EXPRESSION:
    case ASTNodeType.LITERAL:
    case ASTNodeType.TEMPLATE_LITERAL:
    case ASTNodeType.IDENTIFIER:
    case ASTNodeType.ARROW_FUNCTION:
    case ASTNodeType.MEMBER_EXPRESSION:
    case ASTNodeType.BINARY_EXPRESSION:
    case ASTNodeType.UNARY_EXPRESSION:
    case ASTNodeType.CONDITIONAL_EXPRESSION:
    case ASTNodeType.OBJECT_EXPRESSION:
    case ASTNodeType.ARRAY_EXPRESSION:
      return this._analyzeExpression(node);

    default:
      // Unknown node type - skip
      if (this._context.logger) {
        this._context.logger.log('analyzer', 'warn', `Unknown node type: ${node.type}`, {
          nodeType: node.type,
          depth: this._context._recursionDepth,
        });
      }
      return null;
  }
}

// Export helper
export { _analyzeNode };
