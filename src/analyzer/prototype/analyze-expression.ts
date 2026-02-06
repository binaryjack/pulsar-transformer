/**
 * Analyze Expression
 *
 * Converts expression AST nodes to IR.
 */

import type { IASTNode } from '../../parser/ast/index.js'
import { ASTNodeType } from '../../parser/ast/index.js'
import type { IAnalyzerInternal } from '../analyzer.types.js'
import type {
  IArrowFunctionIR,
  IBinaryExpressionIR,
  ICallExpressionIR,
  IConditionalExpressionIR,
  IIdentifierIR,
  IIRNode,
  ILiteralIR,
  IMemberExpressionIR,
  IUnaryExpressionIR,
} from '../ir/index.js'
import { IRNodeType } from '../ir/index.js'

/**
 * Analyze expression node
 */
export function analyzeExpression(this: IAnalyzerInternal, node: IASTNode): IIRNode {
  switch (node.type) {
    case ASTNodeType.LITERAL:
      return this._analyzeLiteral(node as any);

    case ASTNodeType.IDENTIFIER:
      return this._analyzeIdentifier(node as any);

    case ASTNodeType.CALL_EXPRESSION:
      return this._analyzeCallExpression(node as any);

    case ASTNodeType.ARROW_FUNCTION:
      return this._analyzeArrowFunction(node as any);

    case ASTNodeType.BINARY_EXPRESSION:
      return this._analyzeBinaryExpression(node as any);

    case ASTNodeType.UNARY_EXPRESSION:
      return this._analyzeUnaryExpression(node as any);

    case ASTNodeType.MEMBER_EXPRESSION:
      return this._analyzeMemberExpression(node as any);

    case ASTNodeType.CONDITIONAL_EXPRESSION:
      return this._analyzeConditionalExpression(node as any);

    default:
      // Fallback to literal
      return {
        type: IRNodeType.LITERAL_IR,
        literalValue: null,
        rawValue: '',
        metadata: {},
      } as any;
  }
}

/**
 * Analyze literal
 */
function _analyzeLiteral(this: IAnalyzerInternal, node: any): ILiteralIR {
  return {
    type: IRNodeType.LITERAL_IR,
    value: node.value,
    rawValue: node.raw || String(node.value),
    metadata: {
      sourceLocation: node.location?.start,
      optimizations: {
        isStatic: true,
        isPure: true,
      },
    },
  };
}

/**
 * Analyze identifier
 */
function _analyzeIdentifier(this: IAnalyzerInternal, node: any): IIdentifierIR {
  const name = node.name;

  // Determine scope
  let scope: 'local' | 'parameter' | 'global' | 'imported' = 'local';

  if (this._context.imports.has(name)) {
    scope = 'imported';
  } else if (this._isParameter(name)) {
    scope = 'parameter';
  } else if (!this._isInCurrentScope(name)) {
    scope = 'global';
  }

  // Check if identifier is a signal
  const isSignal = this._isSignal(name);

  return {
    type: IRNodeType.IDENTIFIER_IR,
    name,
    scope,
    isSignal,
    metadata: {
      sourceLocation: node.location?.start,
      dependencies: isSignal ? [name] : [],
    },
  };
}

/**
 * Analyze call expression
 */
function _analyzeCallExpression(this: IAnalyzerInternal, node: any): ICallExpressionIR {
  const callee = this._analyzeNode(node.callee) as IIRNode;
  const args = node.arguments.map((arg: any) => this._analyzeNode(arg)).filter((arg: IIRNode | null) => arg !== null);

  // Detect signal creation - support both signal() and createSignal()
  const calleeName = callee.type === IRNodeType.IDENTIFIER_IR ? (callee as any).name : null;
  const isSignalCreation =
    calleeName === 'signal' ||
    calleeName === 'createSignal' ||
    calleeName === 'createMemo' ||
    calleeName === 'createEffect';

  // Detect Pulsar primitives
  const isPulsarPrimitive =
    isSignalCreation || calleeName === 'createResource' || calleeName === 'createStore';

  return {
    type: IRNodeType.CALL_EXPRESSION_IR,
    callee,
    arguments: args,
    isSignalCreation,
    isPulsarPrimitive,
    metadata: {
      sourceLocation: node.location?.start,
      optimizations: {
        isPure: isPulsarPrimitive,
      },
    },
  };
}

/**
 * Analyze binary expression
 */
function _analyzeBinaryExpression(this: IAnalyzerInternal, node: any): IBinaryExpressionIR {
  const left = this._analyzeNode(node.left);
  const right = this._analyzeNode(node.right);

  // Check for null operands (unsupported node types)
  if (!left) {
    const leftType = node.left ? node.left.type : 'null';
    throw new Error(
      `Unsupported node type '${leftType}' in binary expression (left operand) at ${node.location?.start?.line}:${node.location?.start?.column}`
    );
  }
  if (!right) {
    const rightType = node.right ? node.right.type : 'null';
    throw new Error(
      `Unsupported node type '${rightType}' in binary expression (right operand) at ${node.location?.start?.line}:${node.location?.start?.column}`
    );
  }

  return {
    type: IRNodeType.BINARY_EXPRESSION_IR,
    operator: node.operator,
    left,
    right,
    metadata: {
      sourceLocation: node.location?.start,
    },
  };
}

/**
 * Analyze unary expression
 */
function _analyzeUnaryExpression(this: IAnalyzerInternal, node: any): IUnaryExpressionIR {
  const argument = this._analyzeNode(node.argument);

  // Check for null argument (unsupported node type)
  if (!argument) {
    const argType = node.argument ? node.argument.type : 'null';
    throw new Error(
      `Unsupported node type '${argType}' in unary expression at ${node.location?.start?.line}:${node.location?.start?.column}`
    );
  }

  return {
    type: IRNodeType.UNARY_EXPRESSION_IR,
    operator: node.operator,
    argument,
    prefix: node.prefix !== false, // Default to true
    metadata: {
      sourceLocation: node.location?.start,
    },
  };
}

/**
 * Analyze member expression
 */
function _analyzeMemberExpression(this: IAnalyzerInternal, node: any): IMemberExpressionIR {
  const object = this._analyzeNode(node.object);
  const property = this._analyzeIdentifier(node.property);

  return {
    type: IRNodeType.MEMBER_EXPRESSION_IR,
    object,
    property,
    metadata: {
      sourceLocation: node.location?.start,
    },
  };
}

/**
 * Analyze conditional expression
 */
function _analyzeConditionalExpression(
  this: IAnalyzerInternal,
  node: any
): IConditionalExpressionIR {
  return {
    type: IRNodeType.CONDITIONAL_EXPRESSION_IR,
    test: this._analyzeNode(node.test),
    consequent: this._analyzeNode(node.consequent),
    alternate: this._analyzeNode(node.alternate),
    metadata: {
      sourceLocation: node.location?.start,
    },
  };
}

/**
 * Analyze arrow function
 */
function _analyzeArrowFunction(this: IAnalyzerInternal, node: any): IArrowFunctionIR {
  // Enter function scope
  this._enterScope('arrow-function');

  const params = node.params.map((param: any) => this._analyzeIdentifier(param));

  // Analyze body
  let body: IIRNode | IIRNode[];
  if (node.body && node.body.type === ASTNodeType.BLOCK_STATEMENT) {
    // Block body: () => { statements }
    body = node.body.body.map((stmt: any) => this._analyzeNode(stmt)).filter((stmt: IIRNode | null) => stmt !== null);
  } else if (Array.isArray(node.body)) {
    // Array of statements (shouldn't happen from parser, but handle it)
    body = node.body.map((stmt: any) => this._analyzeNode(stmt)).filter((stmt: IIRNode | null) => stmt !== null);
  } else {
    // Expression body: () => expression
    body = this._analyzeNode(node.body);
  }

  // Detect captured variables (simplified)
  const captures: string[] = [];

  // Exit function scope
  this._exitScope();

  // Determine if function is pure
  const isPure = this._isFunctionPure(body);

  return {
    type: IRNodeType.ARROW_FUNCTION_IR,
    params: params as IIdentifierIR[],
    body,
    captures,
    isPure,
    metadata: {
      sourceLocation: node.location?.start,
      optimizations: {
        isPure,
      },
    },
  };
}

/**
 * Check if function is pure
 */
function _isFunctionPure(this: IAnalyzerInternal, body: IIRNode | IIRNode[] | null): boolean {
  // Null or undefined body is considered pure
  if (!body) return true;

  // Simple heuristic: function is pure if it only contains expressions
  if (Array.isArray(body)) {
    return body.every((node) => node && node.type !== IRNodeType.CALL_EXPRESSION_IR);
  }
  return body.type !== IRNodeType.CALL_EXPRESSION_IR;
}

/**
 * Check if name is a parameter
 */
function _isParameter(this: IAnalyzerInternal, name: string): boolean {
  const currentScope = this._context.scopes[0];
  if (!currentScope) return false;

  const variable = currentScope.variables.get(name);
  return variable ? variable.kind === 'parameter' : false;
}

// Export helpers
export {
  _analyzeArrowFunction,
  _analyzeBinaryExpression,
  _analyzeCallExpression,
  _analyzeConditionalExpression,
  _analyzeIdentifier,
  _analyzeLiteral,
  _analyzeMemberExpression,
  _analyzeUnaryExpression,
  _isFunctionPure,
  _isParameter
}

