/**
 * Reactivity Transformer
 *
 * Transforms PSR reactivity syntax to Pulsar runtime functions.
 */

import type { ICallExpressionIR, IIdentifierIR, IIRNode } from '../analyzer/ir/ir-node-types.js';
import { IRNodeType } from '../analyzer/ir/ir-node-types.js';
import { visitIRNode } from './ir-visitor.js';

/**
 * Reactivity function mapping
 */
const REACTIVITY_TRANSFORMS: Record<string, string> = {
  signal: 'createSignal',
  computed: 'createMemo',
  effect: 'createEffect',
};

/**
 * Transform PSR reactivity syntax to Pulsar runtime syntax
 */
export function transformReactivity(ir: IIRNode): IIRNode {
  return visitIRNode(ir, {
    [IRNodeType.CALL_EXPRESSION_IR]: transformCallExpression,
  })!;
}

/**
 * Transform call expression reactivity functions
 */
function transformCallExpression(node: IIRNode, _parent: IIRNode | null): IIRNode {
  const callExpr = node as ICallExpressionIR;

  // Check if callee is an identifier
  if (callExpr.callee.type === IRNodeType.IDENTIFIER_IR) {
    const callee = callExpr.callee as IIdentifierIR;
    const functionName = callee.name;

    // Transform reactivity function names
    if (functionName in REACTIVITY_TRANSFORMS) {
      const transformedName = REACTIVITY_TRANSFORMS[functionName];

      // Create new callee with transformed name
      const newCallee: IIdentifierIR = {
        ...callee,
        name: transformedName,
      };

      // Return transformed call expression
      const transformed: ICallExpressionIR = {
        ...callExpr,
        callee: newCallee,
      };
      return transformed;
    }
  }

  return node;
}
