/**
 * Create Array.isArray check
 * Example: Array.isArray(value)
 */
import * as ts from 'typescript';
import { identifier } from './identifier.js';
import { methodCall } from './method-call.js';

export function isArrayCheck(identifierName: string): ts.Expression {
  return methodCall('Array', 'isArray', [identifier(identifierName)]);
}
