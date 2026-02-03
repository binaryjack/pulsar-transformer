/**
 * Emit Arrow Function Method
 *
 * Generates code for ArrowFunctionIR nodes.
 */

import type { IArrowFunctionIR } from '../../analyzer/ir/ir-node-types.js';
import type { IEmitterInternal } from '../emitter.types.js';

/**
 * Emit arrow function
 */
export function _emitArrowFunction(this: IEmitterInternal, ir: IArrowFunctionIR): void {
  const { params, body } = ir;

  const paramList = params.map((p) => p.name).join(', ');

  // Body can be single expression or array of statements
  if (Array.isArray(body)) {
    // Block body
    this._addLine(`(${paramList}) => {`);
    this.context.indentLevel++;
    for (const stmt of body) {
      this.emit(stmt);
    }
    this.context.indentLevel--;
    this._addLine(`}`);
  } else {
    // Expression body
    const bodyCode = this.emit(body);
    this._addLine(`(${paramList}) => ${bodyCode}`);
  }
}
