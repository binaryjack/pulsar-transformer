/**
 * Create block
 */
import * as ts from 'typescript';

const factory = ts.factory;

export function block(statements: ts.Statement[], multiLine: boolean = true): ts.Block {
  return factory.createBlock(statements, multiLine);
}
