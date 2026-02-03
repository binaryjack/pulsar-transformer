/**
 * Emit Identifier Method
 *
 * Generates code for IdentifierIR nodes.
 */

import type { IIdentifierIR } from '../../analyzer/ir/ir-node-types.js';
import type { IEmitterInternal } from '../emitter.types.js';

/**
 * Emit identifier
 */
export function _emitIdentifier(this: IEmitterInternal, ir: IIdentifierIR): void {
  this._addLine(ir.name);
}
