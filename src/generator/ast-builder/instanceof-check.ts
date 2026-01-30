/**
 * Create instanceof check
 * Example: value instanceof HTMLElement
 */
import * as ts from 'typescript';
import { identifier } from './identifier.js';

const factory = ts.factory;

export function instanceofCheck(identifierName: string, className: string): ts.Expression {
  return factory.createBinaryExpression(
    identifier(identifierName),
    ts.SyntaxKind.InstanceOfKeyword,
    identifier(className)
  );
}
