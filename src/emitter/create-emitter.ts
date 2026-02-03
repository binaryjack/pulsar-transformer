/**
 * Create Emitter Factory
 *
 * Factory function for creating Emitter instances.
 */

import { Emitter } from './emitter.js';
import type { IEmitter, IEmitterConfig } from './emitter.types.js';

// Attach prototype methods
import './prototype/emitter-prototype.js';

/**
 * Create an emitter instance
 */
export function createEmitter(config?: IEmitterConfig): IEmitter {
  return new Emitter(config) as unknown as IEmitter;
}
