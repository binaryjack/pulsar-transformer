/**
 * Emit Component Method
 *
 * Generates code for ComponentIR nodes.
 */

import type { IComponentIR } from '../../analyzer/ir/ir-node-types.js';
import { IRNodeType } from '../../analyzer/ir/ir-node-types.js';
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

  // Generate function signature with export and return type
  const paramList = params.map((p) => p.name).join(', ');
  this._addLine(`export function ${name}(${paramList}): HTMLElement {`);
  this.context.indentLevel++;

  // Generate registry wrapper with null parentId
  this._addLine(`return $REGISTRY.execute('${registryKey}', () => {`);
  this.context.indentLevel++;

  // Emit body statements
  for (const stmt of body) {
    this._emitStatement(stmt);
  }

  // Handle return expression if no explicit return in body
  if (ir.returnExpression && !body.some((stmt) => stmt.type === IRNodeType.RETURN_STATEMENT_IR)) {
    const returnExpr = this._emitExpression(ir.returnExpression);
    this._addLine(`return ${returnExpr};`);
  }

  this.context.indentLevel--;
  this._addLine(`});`);

  this.context.indentLevel--;
  this._addLine(`}`);
}
