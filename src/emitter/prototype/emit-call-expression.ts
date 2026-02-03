/**
 * Emit Call Expression Method
 *
 * Generates code for CallExpressionIR nodes.
 */

import type { ICallExpressionIR } from '../../analyzer/ir/ir-node-types.js';
import type { IEmitterInternal } from '../emitter.types.js';

/**
 * Emit function call
 */
export function _emitCallExpression(this: IEmitterInternal, ir: ICallExpressionIR): void {
  const { callee, arguments: args } = ir;

  const calleeName = callee.name;
  const argsList = args.map((arg) => this.emit(arg)).join(', ');

  this._addLine(`${calleeName}(${argsList})`);
}
