/**
 * Indent Helper Method
 *
 * Returns current indentation string.
 */

import type { IEmitterInternal } from '../emitter.types.js';

/**
 * Get current indentation string
 */
export function _indent(this: IEmitterInternal): string {
  return this.context.config.indent.repeat(this.context.indentLevel);
}
