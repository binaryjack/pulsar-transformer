/**
 * Add Line Helper Method
 *
 * Adds a line of code with proper indentation.
 */

import type { IEmitterInternal } from '../emitter.types.js';

/**
 * Add a line of code
 */
export function _addLine(this: IEmitterInternal, line: string): void {
  if (line.trim().length === 0) {
    this.context.code.push('');
  } else {
    this.context.code.push(this._indent() + line);
  }
}
