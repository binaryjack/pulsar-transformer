/**
 * Create a binary expression
 * Example: a === b, a && b, a || b
 */
import * as ts from 'typescript';

const factory = ts.factory;

export function binaryExpression(
  left: ts.Expression,
  operator: ts.BinaryOperator,
  right: ts.Expression
): ts.BinaryExpression {
  return factory.createBinaryExpression(left, operator, right);
}
