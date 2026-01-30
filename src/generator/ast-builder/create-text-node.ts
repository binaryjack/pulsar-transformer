/**
 * Create document.createTextNode call
 * Example: document.createTextNode('text')
 */
import * as ts from 'typescript';
import { methodCall } from './method-call.js';

const factory = ts.factory;

export function createTextNode(text: string | ts.Expression): ts.Expression {
  const textExpr = typeof text === 'string' ? factory.createStringLiteral(text) : text;
  return methodCall('document', 'createTextNode', [textExpr]);
}
