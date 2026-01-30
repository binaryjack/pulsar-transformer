/**
 * Create document.createElement call
 * Example: document.createElement('div')
 */
import * as ts from 'typescript';
import { methodCall } from './method-call.js';

const factory = ts.factory;

export function createElement(tagName: string): ts.Expression {
  return methodCall('document', 'createElement', [factory.createStringLiteral(tagName)]);
}
