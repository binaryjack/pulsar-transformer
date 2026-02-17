/**
 * Transform Expression - Preserve reactivity calls unchanged
 */

import type { IExpression } from '../../ast.types.js';
import type { ITransformer } from '../transformer.js';

/**
 * Transform expression
 * Most expressions pass through unchanged
 * Reactivity calls (createSignal, useEffect) are preserved
 */
export function transformExpression(this: ITransformer, node: IExpression): IExpression {
  // Call expressions need special handling to track imports
  if (node.type === 'CallExpression') {
    return this.transformCallExpression(node as any);
  }

  // JSX elements pass through (CodeGenerator handles them)
  if (node.type === 'JSXElement') {
    return this.transformJSXElement(node as any);
  }

  // All other expressions pass through unchanged
  return node;
}

