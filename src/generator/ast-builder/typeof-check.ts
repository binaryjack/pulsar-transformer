/**
 * Create typeof check
 * Example: typeof value === 'function'
 */
import * as ts from 'typescript';
import { identifier } from './identifier.js';
import { stringLiteral } from './string-literal.js';

const factory = ts.factory;

export function typeofCheck(
  identifierName: string,
  typeString: 'string' | 'number' | 'boolean' | 'function' | 'object' | 'undefined'
): ts.Expression {
  return factory.createBinaryExpression(
    factory.createTypeOfExpression(identifier(identifierName)),
    ts.SyntaxKind.EqualsEqualsEqualsToken,
    stringLiteral(typeString)
  );
}
