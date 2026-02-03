/**
 * Emit Event Handler Method
 *
 * Generates code for EventHandlerIR nodes.
 */

import type { IEventHandlerIR } from '../../analyzer/ir/ir-node-types.js';
import type { IEmitterInternal } from '../emitter.types.js';

/**
 * Emit event listener (addEventListener call)
 */
export function _emitEventHandler(this: IEmitterInternal, ir: IEventHandlerIR): void {
  const { eventName, handler } = ir;

  // Normalize event name (onClick → click)
  const normalizedEvent = eventName.replace(/^on/, '').toLowerCase();

  // Emit handler code
  const handlerCode = this.emit(handler);

  // Simplified version - just note the handler exists
  // Full implementation with element context happens at element level
  this._addLine(`// TODO: addEventListener('${normalizedEvent}', ${handlerCode})`);
}
