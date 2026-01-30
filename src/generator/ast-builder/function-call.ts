/**
 * Create function call
 * Example: functionName(arg1, arg2)
 */
import * as ts from 'typescript';
import { identifier } from './identifier.js';

const factory = ts.factory;

export function functionCall(
  functionName: string | ts.Expression,
  args: ts.Expression[] = []
): ts.Expression {
  const fn = typeof functionName === 'string' ? identifier(functionName) : functionName;
  return factory.createCallExpression(fn, undefined, args);
}
