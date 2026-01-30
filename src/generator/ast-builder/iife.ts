/**
 * Create IIFE (Immediately Invoked Function Expression)
 * Example: (() => { statements })()
 */
import * as ts from 'typescript';
import { arrowFunction } from './arrow-function.js';
import { block } from './block.js';

const factory = ts.factory;

export function iife(statements: ts.Statement[]): ts.Expression {
  return factory.createCallExpression(
    factory.createParenthesizedExpression(arrowFunction([], block(statements, true))),
    undefined,
    []
  );
}
