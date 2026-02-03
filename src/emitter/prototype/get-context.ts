/**
 * Get Context Method
 *
 * Returns current emit context.
 */

import type { IEmitContext, IEmitterInternal } from '../emitter.types.js';

/**
 * Get current context
 */
export function getContext(this: IEmitterInternal): IEmitContext {
  return this.context;
}
