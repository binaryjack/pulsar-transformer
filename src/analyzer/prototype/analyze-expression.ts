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
  IBinaryExpressionIR,
  ICallExpressionIR,
  IConditionalExpressionIR,
  IIdentifierIR,
  IIRNode,
  ILiteralIR,
  IMemberExpressionIR,
  ISignalBindingIR,
  IUnaryExpressionIR,
} from '../ir/index.js';
import { IRNodeType } from '../ir/index.js';

/**
 * Analyze expression node
 */
export function analyzeExpression(this: IAnalyzerInternal, node: IASTNode): IIRNode {
  switch (node.type) {
    case ASTNodeType.LITERAL:
      return this._analyzeLiteral(node as any);

    case ASTNodeType.TEMPLATE_LITERAL:
      return this._analyzeTemplateLiteral(node as any);

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

    case ASTNodeType.OBJECT_EXPRESSION:
      return this._analyzeObjectExpression(node as any);

    case ASTNodeType.ARRAY_EXPRESSION:
      return this._analyzeArrayExpression(node as any);

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
 * Analyze template literal
 * Supports embedded expressions: `hello ${name}`
 */
function _analyzeTemplateLiteral(this: IAnalyzerInternal, node: any): ILiteralIR | any {
  // Check if this is a simple template literal (no expressions)
  if (!node.expressions || node.expressions.length === 0) {
    // Simple template literal - treat as string literal
    const value = node.quasis && node.quasis[0] ? node.quasis[0].value.cooked : node.value || '';
    return {
      type: IRNodeType.LITERAL_IR,
      value,
      rawValue: node.raw || `\`${value}\``,
      metadata: {
        sourceLocation: node.location?.start,
        optimizations: {
          isStatic: true,
          isPure: true,
        },
      },
    };
  }

  // Template literal with embedded expressions
  // Convert to a series of concatenations
  const parts: any[] = [];

  for (let i = 0; i < node.quasis.length; i++) {
    const quasi = node.quasis[i];

    // Add the string part if non-empty
    if (quasi.value.cooked) {
      parts.push({
        type: IRNodeType.LITERAL_IR,
        value: quasi.value.cooked,
        rawValue: `"${quasi.value.cooked}"`,
        metadata: {
          sourceLocation: quasi.location?.start,
          optimizations: {
            isStatic: true,
            isPure: true,
          },
        },
      });
    }

    // Add the expression part (if not the last quasi)
    if (i < node.expressions.length) {
      const expr = analyzeExpression.call(this, node.expressions[i]);
      parts.push(expr);
    }
  }

  // If only one part, return it directly
  if (parts.length === 1) {
    return parts[0];
  }

  // Build a chain of binary concatenation expressions
  let result = parts[0];
  for (let i = 1; i < parts.length; i++) {
    result = {
      type: IRNodeType.BINARY_EXPRESSION_IR,
      operator: '+',
      left: result,
      right: parts[i],
      metadata: {
        sourceLocation: node.location?.start,
        optimizations: {
          isStatic: false,
          isPure: true,
        },
      },
    };
  }

  return result;
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
function _analyzeCallExpression(
  this: IAnalyzerInternal,
  node: any
): ICallExpressionIR | ISignalBindingIR {
  const callee = this._analyzeNode(node.callee) as IIRNode;
  const args = node.arguments
    .map((arg: any) => this._analyzeNode(arg))
    .filter((arg: IIRNode | null) => arg !== null);

  // Detect signal creation - support both signal() and createSignal()
  const calleeName = callee.type === IRNodeType.IDENTIFIER_IR ? (callee as any).name : null;
  const isSignalCreation =
    calleeName === 'signal' ||
    calleeName === 'createSignal' ||
    calleeName === 'createMemo' ||
    calleeName === 'createEffect';

  // CRITICAL FIX: Detect signal GETTER calls (e.g., count())
  // When {count()} is used in JSX children, convert to SIGNAL_BINDING_IR for reactive wiring
  // ONLY apply this transformation when we're inside JSX element children context
  if (
    calleeName &&
    args.length === 0 &&
    this._isSignal(calleeName) &&
    this._context.inJSXChildren
  ) {
    // This is a signal getter call in JSX - convert to SignalBindingIR
    return {
      type: IRNodeType.SIGNAL_BINDING_IR,
      signalName: calleeName,
      canOptimize: true,
      isExternal: false,
      metadata: {
        sourceLocation: node.location?.start,
        optimizations: {
          canInline: true,
        },
        dependencies: [calleeName],
      },
    };
  }

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

  // Handle computed vs non-computed property access
  let property;
  if (node.computed) {
    // Computed access: obj[expr] - analyze property as expression
    property = this._analyzeNode(node.property);
  } else {
    // Non-computed access: obj.prop - analyze property as identifier
    property = this._analyzeIdentifier(node.property);
  }

  return {
    type: IRNodeType.MEMBER_EXPRESSION_IR,
    object,
    property,
    computed: node.computed || false,
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
    body = node.body.body
      .map((stmt: any) => this._analyzeNode(stmt))
      .filter((stmt: IIRNode | null) => stmt !== null);
  } else if (Array.isArray(node.body)) {
    // Array of statements (shouldn't happen from parser, but handle it)
    body = node.body
      .map((stmt: any) => this._analyzeNode(stmt))
      .filter((stmt: IIRNode | null) => stmt !== null);
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

/**
 * Analyze object expression
 * Converts ObjectExpression AST node by analyzing each property value to IR
 */
function _analyzeObjectExpression(this: IAnalyzerInternal, node: any): ILiteralIR {
  // Analyze each property to convert to IR
  const analyzedProperties = (node.properties || []).map((prop: any) => {
    if (prop.type === 'SpreadElement') {
      return {
        type: 'SpreadElement',
        argument: this._analyzeNode(prop.argument), // Convert to IR
      };
    }
    return {
      key: prop.key, // Keep key as-is (it's just an identifier name)
      value: this._analyzeNode(prop.value), // Convert value to IR
    };
  });

  // Create a synthetic ObjectExpression with analyzed properties
  const analyzedNode = {
    ...node,
    properties: analyzedProperties,
  };

  return {
    type: IRNodeType.LITERAL_IR,
    value: analyzedNode,
    rawValue: 'ObjectExpression',
    metadata: {
      sourceLocation: node.location?.start,
      optimizations: {
        isStatic: true,
        isPure: true,
      },
      isObjectExpression: true,
    },
  } as any;
}

/**
 * Analyze array expression
 * Converts ArrayExpression AST node by analyzing each element to IR
 */
function _analyzeArrayExpression(this: IAnalyzerInternal, node: any): ILiteralIR {
  // Analyze each element to convert to IR
  const analyzedElements = (node.elements || []).map((elem: any) => {
    if (elem.type === 'SpreadElement') {
      return {
        type: 'SpreadElement',
        argument: this._analyzeNode(elem.argument), // Convert to IR
      };
    }
    return this._analyzeNode(elem); // Convert element to IR
  });

  // Create a synthetic ArrayExpression with analyzed elements
  const analyzedNode = {
    ...node,
    elements: analyzedElements,
  };

  return {
    type: IRNodeType.LITERAL_IR,
    value: analyzedNode,
    rawValue: 'ArrayExpression',
    metadata: {
      sourceLocation: node.location?.start,
      optimizations: {
        isStatic: true,
        isPure: true,
      },
      isArrayExpression: true,
    },
  } as any;
}

// Export helpers
export {
  _analyzeArrayExpression,
  _analyzeArrowFunction,
  _analyzeBinaryExpression,
  _analyzeCallExpression,
  _analyzeConditionalExpression,
  _analyzeIdentifier,
  _analyzeLiteral,
  _analyzeMemberExpression,
  _analyzeObjectExpression,
  _analyzeTemplateLiteral,
  _analyzeUnaryExpression,
  _isFunctionPure,
  _isParameter,
};
