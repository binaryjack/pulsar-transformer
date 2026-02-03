/**
 * Emitter Module Exports
 *
 * Public API for code generation.
 */

export { createEmitter } from './create-emitter.js';
export { createImportTracker } from './create-import-tracker.js';
export type {
  ICodeGenerator,
  IElementGenerator,
  IEmitContext,
  IEmitter,
  IEmitterConfig,
  IEventGenerator,
  IImportTracker,
  IRegistryGenerator,
} from './emitter.types.js';
