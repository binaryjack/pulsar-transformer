/**
 * Transform Call Expression - Preserve but track reactivity imports
 */

import type { ICallExpression } from '../../parser/parser.types.js';
import type { ITransformer } from '../transformer.js';

/**
 * Transform call expression
 * Preserve reactivity function calls unchanged
 * Track which reactivity functions are used for import generation
 */
export function transformCallExpression(
  this: ITransformer,
  node: ICallExpression
): ICallExpression {
  // Check if this is a reactivity function call
  if (node.callee.type === 'Identifier') {
    const calleeName = node.callee.name;
    const reactivityFunctions = [
      'createSignal',
      'useEffect',
      'createMemo',
      'createResource',
      'onMount',
      'onCleanup',
    ];

    if (reactivityFunctions.includes(calleeName)) {
      this.context.usedImports.add(calleeName);
    }
  }

  // Pass through unchanged - these are runtime calls
  return node;
}
