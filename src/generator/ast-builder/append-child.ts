/**
 * Create appendChild call
 * Example: parent.appendChild(child)
 */
import * as ts from 'typescript';
import { methodCallStatement } from './method-call-statement.js';

export function appendChild(parentVar: string, childExpr: ts.Expression): ts.Statement {
  return methodCallStatement(parentVar, 'appendChild', [childExpr]);
}
