/**
 * Create null check: value !== null && value !== undefined && value !== false
 */
import * as ts from 'typescript';
import { identifier } from './identifier.js';

const factory = ts.factory;

export function notNullUndefinedFalse(identifierName: string): ts.Expression {
  const id = identifier(identifierName);
  return factory.createBinaryExpression(
    factory.createBinaryExpression(
      factory.createBinaryExpression(
        id,
        ts.SyntaxKind.ExclamationEqualsEqualsToken,
        factory.createNull()
      ),
      ts.SyntaxKind.AmpersandAmpersandToken,
      factory.createBinaryExpression(
        id,
        ts.SyntaxKind.ExclamationEqualsEqualsToken,
        identifier('undefined')
      )
    ),
    ts.SyntaxKind.AmpersandAmpersandToken,
    factory.createBinaryExpression(
      id,
      ts.SyntaxKind.ExclamationEqualsEqualsToken,
      factory.createFalse()
    )
  );
}
