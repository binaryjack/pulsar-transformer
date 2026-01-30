/**
 * Create an array literal
 */
import * as ts from 'typescript';

const factory = ts.factory;

export function arrayLiteral(elements: ts.Expression[] = []): ts.ArrayLiteralExpression {
  return factory.createArrayLiteralExpression(elements, false);
}
