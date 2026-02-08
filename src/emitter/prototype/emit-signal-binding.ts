/**
 * Emit Signal Binding Method
 *
 * Generates code for SignalBindingIR nodes.
 * 
 * NOTE: Signal binding emission is primarily handled in emit-expression.ts
 * when processing ELEMENT_IR children. This function is kept for compatibility
 * but the main emission logic is in the SIGNAL_BINDING_IR case of _emitExpression.
 */

import type { ISignalBindingIR } from '../../analyzer/ir/ir-node-types.js';
import type { IEmitterInternal } from '../emitter.types.js';

/**
 * Emit signal binding ($REGISTRY.wire call)
 * 
 * ACTUAL IMPLEMENTATION: See emit-expression.ts, case IRNodeType.SIGNAL_BINDING_IR
 * This generates: (() => { const _t = document.createTextNode(''); $REGISTRY.wire(_t, 'textContent', () => signalName()); return _t; })()
 */
export function _emitSignalBinding(this: IEmitterInternal, ir: ISignalBindingIR): void {
  const { signalName } = ir;

  // Add import
  this.context.imports.addImport(this.context.config.runtimePaths.registry!, '$REGISTRY');

  // Debug logging if enabled
  if (this.context.config.debug?.logSignalBindings) {
    console.log(
      `[EMITTER] Signal binding for ${signalName} (via _emitSignalBinding - consider using emit-expression.ts instead)`
    );
  }

  // Generate the same pattern as in emit-expression.ts
  const textNodeVar = `_t${this.context.elementCounter++}`;
  
  this._addLine(
    `(() => { const ${textNodeVar} = document.createTextNode(''); $REGISTRY.wire(${textNodeVar}, 'textContent', () => ${signalName}()); return ${textNodeVar}; })()`
  );
}
