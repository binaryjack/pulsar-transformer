/**
 * Emit Literal Method
 *
 * Generates code for LiteralIR nodes.
 */

import type { ILiteralIR } from '../../analyzer/ir/ir-node-types.js';
import type { IEmitterInternal } from '../emitter.types.js';

/**
 * Emit literal value
 */
export function _emitLiteral(this: IEmitterInternal, ir: ILiteralIR): void {
  const { rawValue } = ir;
  this._addLine(rawValue);
}
