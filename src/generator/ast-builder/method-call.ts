/**
 * Create a method call expression
 * Example: object.method(arg1, arg2)
 */
import * as ts from 'typescript';

const factory = ts.factory;

export function methodCall(
  objectName: string,
  methodName: string,
  args: ts.Expression[] = []
): ts.Expression {
  return factory.createCallExpression(
    factory.createPropertyAccessExpression(
      factory.createIdentifier(objectName),
      factory.createIdentifier(methodName)
    ),
    undefined,
    args
  );
}
