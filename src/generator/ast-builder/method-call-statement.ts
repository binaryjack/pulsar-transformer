/**
 * Create a method call statement
 * Example: object.method(arg1, arg2);
 */
import * as ts from 'typescript';
import { methodCall } from './method-call.js';

const factory = ts.factory;

export function methodCallStatement(
  objectName: string,
  methodName: string,
  args: ts.Expression[] = []
): ts.Statement {
  return factory.createExpressionStatement(methodCall(objectName, methodName, args));
}
