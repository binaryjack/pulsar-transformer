/**
 * Create return statement
 */
import * as ts from 'typescript';

const factory = ts.factory;

export function returnStatement(expression?: ts.Expression): ts.ReturnStatement {
  return factory.createReturnStatement(expression);
}
