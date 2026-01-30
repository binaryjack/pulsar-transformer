/**
 * Create object literal
 */
import * as ts from 'typescript';

const factory = ts.factory;

export function objectLiteral(
  properties: ts.ObjectLiteralElementLike[],
  multiLine: boolean = true
): ts.ObjectLiteralExpression {
  return factory.createObjectLiteralExpression(properties, multiLine);
}
