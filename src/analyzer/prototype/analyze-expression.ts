/**
 * Analyze Expression
 *
 * Converts expression AST nodes to IR.
 */

import type { IASTNode } from '../../parser/ast/index.js';
import { ASTNodeType } from '../../parser/ast/index.js';
import type { IAnalyzerInternal } from '../analyzer.types.js';
import type {
  IArrowFunctionIR,
  ICallExpressionIR,
  IIdentifierIR,
  IIRNode,
  ILiteralIR,
} from '../ir/index.js';
import { IRNodeType } from '../ir/index.js';

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

    default:
      // Fallback to literal
      return {
        type: IRNodeType.LITERAL_IR,
        value: null,
        rawValue: '',
        metadata: {},
      };
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
  const callee = this._analyzeIdentifier(node.callee) as IIdentifierIR;
  const args = node.arguments.map((arg: any) => this._analyzeNode(arg));

  // Detect signal creation (createSignal, createMemo, createEffect)
  const isSignalCreation =
    callee.name === 'createSignal' ||
    callee.name === 'createMemo' ||
    callee.name === 'createEffect';

  // Detect Pulsar primitives
  const isPulsarPrimitive =
    isSignalCreation || callee.name === 'createResource' || callee.name === 'createStore';

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
 * Analyze arrow function
 */
function _analyzeArrowFunction(this: IAnalyzerInternal, node: any): IArrowFunctionIR {
  // Enter function scope
  this._enterScope('arrow-function');

  const params = node.params.map((param: any) => this._analyzeIdentifier(param));

  // Analyze body
  let body: IIRNode | IIRNode[];
  if (Array.isArray(node.body)) {
    body = node.body.map((stmt: any) => this._analyzeNode(stmt));
  } else {
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
function _isFunctionPure(this: IAnalyzerInternal, body: IIRNode | IIRNode[]): boolean {
  // Simple heuristic: function is pure if it only contains expressions
  if (Array.isArray(body)) {
    return body.every((node) => node.type !== IRNodeType.CALL_EXPRESSION_IR);
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
  _analyzeCallExpression,
  _analyzeIdentifier,
  _analyzeLiteral,
  _isFunctionPure,
  _isParameter,
};
