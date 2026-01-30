/**
 * Create removeChild call
 * Example: parent.removeChild(child)
 */
import * as ts from 'typescript';
import { methodCallStatement } from './method-call-statement.js';

export function removeChild(parentVar: string, childExpr: ts.Expression): ts.Statement {
  return methodCallStatement(parentVar, 'removeChild', [childExpr]);
}
