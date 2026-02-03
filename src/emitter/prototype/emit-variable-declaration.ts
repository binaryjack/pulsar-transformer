/**
 * Emit Variable Declaration Method
 *
 * Generates code for VariableDeclarationIR nodes.
 */

import type { IVariableDeclarationIR } from '../../analyzer/ir/ir-node-types.js';
import type { IEmitterInternal } from '../emitter.types.js';

/**
 * Emit variable declaration
 */
export function _emitVariableDeclaration(this: IEmitterInternal, ir: IVariableDeclarationIR): void {
  const { kind, name, initializer, isSignalDeclaration, isDestructuring, destructuringNames } = ir;

  if (isSignalDeclaration && isDestructuring && destructuringNames) {
    // Signal declaration with destructuring: const [count, setCount] = createSignal(0);
    this.context.imports.addImport(this.context.config.runtimePaths.core!, 'createSignal');

    // Use the destructured names directly from AST
    const namesStr = destructuringNames.join(', ');
    const initExpr = initializer ? this._emitExpression(initializer) : 'undefined';

    this._addLine(`${kind} [${namesStr}] = ${initExpr};`);
  } else if (isSignalDeclaration) {
    // Signal declaration without destructuring: const value = createSignal(init);
    this.context.imports.addImport(this.context.config.runtimePaths.core!, 'createSignal');

    const setterName = `set${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    const initExpr = initializer ? this._emitExpression(initializer) : 'undefined';

    this._addLine(`${kind} [${name}, ${setterName}] = ${initExpr};`);
  } else if (isDestructuring && destructuringNames) {
    // Regular destructuring: const [a, b] = value;
    const namesStr = destructuringNames.join(', ');
    const initExpr = initializer ? ` = ${this._emitExpression(initializer)}` : '';

    this._addLine(`${kind} [${namesStr}]${initExpr};`);
  } else {
    // Regular declaration: const x = value;
    const initExpr = initializer ? ` = ${this._emitExpression(initializer)}` : '';
    this._addLine(`${kind} ${name}${initExpr};`);
  }
}
