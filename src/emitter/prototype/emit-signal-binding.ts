/**
 * Emit Signal Binding Method
 *
 * Generates code for SignalBindingIR nodes.
 */

import type { ISignalBindingIR } from '../../analyzer/ir/ir-node-types.js';
import type { IEmitterInternal } from '../emitter.types.js';

/**
 * Emit signal binding ($REGISTRY.wire call)
 */
export function _emitSignalBinding(this: IEmitterInternal, ir: ISignalBindingIR): void {
  const { signalName } = ir;

  // Add import
  this.context.imports.addImport(this.context.config.runtimePaths.registry!, '$REGISTRY');

  // Simplified version - just note the binding exists
  // Full implementation with element/property tracking happens at element level
  this._addLine(`// TODO: wire ${signalName} to element property`);
}
