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
  const {
    kind,
    name,
    initializer,
    typeAnnotation,
    isSignalDeclaration,
    isDestructuring,
    destructuringNames,
  } = ir;

  // Build type annotation string if present
  const typeStr = typeAnnotation ? `: ${typeAnnotation.typeString}` : '';

  if (isSignalDeclaration && isDestructuring && destructuringNames) {
    // Signal declaration with destructuring: const [count, setCount] = createSignal(0);
    this.context.imports.addImport(this.context.config.runtimePaths.core!, 'createSignal');

    // Use the destructured names directly from AST
    const namesStr = destructuringNames.join(', ');
    const initExpr = initializer ? this._emitExpression(initializer) : 'undefined';

    this._addLine(`${kind} [${namesStr}]${typeStr} = ${initExpr};`);
  } else if (isSignalDeclaration) {
    // Check what function is being called
    const functionName = (initializer as any)?.callee?.name || 'createSignal';

    // Functions that return [getter, setter] tuple - NEED destructuring
    const needsDestructuring =
      functionName === 'createSignal' || functionName === 'useState' || functionName === 'signal';

    if (needsDestructuring) {
      // const [count, setCount] = createSignal(0);
      this.context.imports.addImport(this.context.config.runtimePaths.core!, functionName);

      const setterName = `set${name.charAt(0).toUpperCase()}${name.slice(1)}`;
      const initExpr = initializer ? this._emitExpression(initializer) : 'undefined';

      this._addLine(`${kind} [${name}, ${setterName}]${typeStr} = ${initExpr};`);
    } else {
      // const memo = createMemo(() => ...);
      // createMemo, createEffect, createResource return single function - NO destructuring
      this.context.imports.addImport(this.context.config.runtimePaths.core!, functionName);

      const initExpr = initializer ? this._emitExpression(initializer) : 'undefined';

      this._addLine(`${kind} ${name}${typeStr} = ${initExpr};`);
    }
  } else if (isDestructuring && destructuringNames) {
    // Regular destructuring: const [a, b] = value;
    const namesStr = destructuringNames.join(', ');
    const initExpr = initializer ? ` = ${this._emitExpression(initializer)}` : '';

    this._addLine(`${kind} [${namesStr}]${typeStr}${initExpr};`);
  } else {
    // Regular declaration: const x = value;
    const initExpr = initializer ? ` = ${this._emitExpression(initializer)}` : '';
    this._addLine(`${kind} ${name}${typeStr}${initExpr};`);
  }
}
