/**
 * Create element or text node expression
 * Example: result instanceof HTMLElement ? result : document.createTextNode(String(result))
 */
import * as ts from 'typescript';
import { conditional } from './conditional.js';
import { createTextNode } from './create-text-node.js';
import { functionCall } from './function-call.js';
import { identifier } from './identifier.js';
import { instanceofCheck } from './instanceof-check.js';

export function elementOrTextNode(identifierName: string): ts.Expression {
  return conditional(
    instanceofCheck(identifierName, 'HTMLElement'),
    identifier(identifierName),
    createTextNode(functionCall('String', [identifier(identifierName)]))
  );
}
