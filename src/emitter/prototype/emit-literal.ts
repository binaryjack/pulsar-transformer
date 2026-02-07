/**
 * Emit Literal Method
 *
 * Generates code for LiteralIR nodes.
 */

import type { ILiteralIR } from '../../analyzer/ir/ir-node-types.js';
import { escapeStringLiteral, needsUnicodeEscape } from '../../transformer/unicode-escaper.js';
import type { IEmitterInternal } from '../emitter.types.js';

/**
 * Emit literal value
 */
export function _emitLiteral(this: IEmitterInternal, ir: ILiteralIR): void {
  const { rawValue, value } = ir;

  // For string literals, check if unicode escaping is needed
  if (typeof value === 'string') {
    // Check if the rawValue has quotes (is a string literal)
    const isStringLiteral = /^["'`]/.test(rawValue);

    if (isStringLiteral && needsUnicodeEscape(value)) {
      // Escape unicode and emit
      this._addLine(escapeStringLiteral(value));
      return;
    }
  }

  // No unicode escaping needed or not a string
  this._addLine(rawValue);
}
