/**
 * Create createEffect wrapper
 * Example: createEffect(() => { statements })
 */
import * as ts from 'typescript';
import { arrowFunction } from './arrow-function.js';
import { block } from './block.js';
import { identifier } from './identifier.js';

const factory = ts.factory;

export function createEffect(statements: ts.Statement[]): ts.Statement {
  return factory.createExpressionStatement(
    factory.createCallExpression(identifier('createEffect'), undefined, [
      arrowFunction([], block(statements, true)),
    ])
  );
}
