/**
 * Create an if statement
 */
import * as ts from 'typescript';

const factory = ts.factory;

export function ifStatement(
  condition: ts.Expression,
  thenBlock: ts.Statement[],
  elseBlock?: ts.Statement[]
): ts.Statement {
  return factory.createIfStatement(
    condition,
    factory.createBlock(thenBlock, true),
    elseBlock ? factory.createBlock(elseBlock, true) : undefined
  );
}
