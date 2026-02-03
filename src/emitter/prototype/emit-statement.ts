/**
 * Emit Statement Helper
 *
 * Emits a statement IR node without resetting context.
 * Used for emitting body statements within a component.
 */

import type { IIRNode } from '../../analyzer/ir/ir-node-types.js';
import { IRNodeType } from '../../analyzer/ir/ir-node-types.js';
import type { IEmitterInternal } from '../emitter.types.js';

/**
 * Emit statement without resetting context
 * (no state reset, preserves indentLevel)
 */
export function _emitStatement(this: IEmitterInternal, ir: IIRNode): void {
  switch (ir.type) {
    case IRNodeType.RETURN_STATEMENT_IR:
      // Return statement - emit the argument
      const returnIR = ir as any;
      if (returnIR.argument) {
        const expr = this._emitExpression(returnIR.argument);
        this._addLine(`return ${expr};`);
      } else {
        this._addLine('return;');
      }
      break;

    case IRNodeType.VARIABLE_DECLARATION_IR:
      this._emitVariableDeclaration(ir);
      break;

    case IRNodeType.SIGNAL_BINDING_IR:
      this._emitSignalBinding(ir);
      break;

    case IRNodeType.EVENT_HANDLER_IR:
      this._emitEventHandler(ir);
      break;

    case IRNodeType.REGISTRY_REGISTRATION_IR:
    case IRNodeType.REGISTRY_LOOKUP_IR:
      // Skip - handled by component emitter
      break;

    default:
      throw new Error(`Unsupported statement IR type: ${ir.type}`);
  }
}
