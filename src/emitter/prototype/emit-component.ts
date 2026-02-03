/**
 * Emit Component Method
 *
 * Generates code for ComponentIR nodes.
 */

import type { IComponentIR } from '../../analyzer/ir/ir-node-types.js';
import type { IEmitterInternal } from '../emitter.types.js';

/**
 * Emit component declaration with registry wrapper
 */
export function _emitComponent(this: IEmitterInternal, ir: IComponentIR): void {
  const { name, params, body, registryKey, usesSignals } = ir;

  // Add required imports
  this.context.imports.addImport(this.context.config.runtimePaths.registry!, '$REGISTRY');
  if (usesSignals) {
    this.context.imports.addImport(this.context.config.runtimePaths.core!, 'createSignal');
  }

  // Generate function signature
  const paramList = params.map((p) => p.name).join(', ');
  this._addLine(`export function ${name}(${paramList}): HTMLElement {`);
  this.context.indentLevel++;

  // Generate registry wrapper
  this._addLine(`return $REGISTRY.execute('${registryKey}', () => {`);
  this.context.indentLevel++;

  // Emit body statements
  for (const stmt of body) {
    this._emitStatement(stmt);
  }

  this.context.indentLevel--;
  this._addLine(`});`);

  this.context.indentLevel--;
  this._addLine(`}`);
}
