/**
 * Type checking and type inference
 * Prototype pattern implementation
 */

import type { ISemanticAnalyzer } from '../semantic-analyzer.js';

/**
 * Check if node matches expected type
 */
export function checkType(
  this: ISemanticAnalyzer,
  node: any,
  expectedType: string | null
): boolean {
  if (!expectedType) return true;

  const actualType = this.inferType(node);
  if (!actualType) return true; // Cannot verify

  return actualType === expectedType;
}

/**
 * Infer type from node
 */
export function inferType(this: ISemanticAnalyzer, node: any): string | null {
  if (!node) return null;

  switch (node.type) {
    case 'TypeAnnotation':
      return this.inferType(node.typeAnnotation);

    case 'TSTypeAnnotation':
      return this.inferType(node.typeAnnotation);

    case 'TSStringKeyword':
      return 'string';

    case 'TSNumberKeyword':
      return 'number';

    case 'TSBooleanKeyword':
      return 'boolean';

    case 'TSVoidKeyword':
      return 'void';

    case 'TSAnyKeyword':
      return 'any';

    case 'TSNullKeyword':
      return 'null';

    case 'TSUndefinedKeyword':
      return 'undefined';

    case 'TSArrayType':
      return 'array';

    case 'TSFunctionType':
      return 'function';

    case 'TSUnionType':
      // Return first type for now
      return this.inferType(node.types[0]);

    case 'TSLiteralType':
      return this.inferType(node.literal);

    case 'TSTypeReference':
      return node.typeName.name;

    case 'StringLiteral':
      return 'string';

    case 'NumericLiteral':
      return 'number';

    case 'BooleanLiteral':
      return 'boolean';

    case 'NullLiteral':
      return 'null';

    case 'Identifier':
      // Look up symbol type
      const symbol = this.resolveSymbol(node.name);
      return symbol?.type || null;

    case 'CallExpression':
      // Try to infer from callee
      if (node.callee.type === 'Identifier') {
        const funcSymbol = this.resolveSymbol(node.callee.name);
        return funcSymbol?.type || null;
      }
      return null;

    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
      return 'function';

    case 'ArrayExpression':
      return 'array';

    case 'ObjectExpression':
      return 'object';

    case 'JSXElement':
    case 'JSXFragment':
      return 'HTMLElement';

    default:
      return null;
  }
}

