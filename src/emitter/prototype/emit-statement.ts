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
    // Top-level statement types
    case IRNodeType.COMPONENT_IR:
      this._emitComponent(ir);
      break;

    case IRNodeType.IMPORT:
      this._emitImport(ir);
      break;

    case IRNodeType.EXPORT:
      this._emitExport(ir);
      break;

    // Function body statement types
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

    case IRNodeType.IF_STATEMENT_IR:
      // If statement - emit test, consequent, and optional alternate
      const ifStmt = ir as any;
      const test = this._emitExpression(ifStmt.test);
      this._addLine(`if (${test}) {`);
      this.context.indentLevel++;

      // Emit consequent
      if (Array.isArray(ifStmt.consequent)) {
        for (const stmt of ifStmt.consequent) {
          this._emitStatement(stmt);
        }
      } else {
        this._emitStatement(ifStmt.consequent);
      }

      this.context.indentLevel--;

      // Emit alternate (else clause) if present
      if (ifStmt.alternate) {
        this._addLine('} else {');
        this.context.indentLevel++;

        if (Array.isArray(ifStmt.alternate)) {
          for (const stmt of ifStmt.alternate) {
            this._emitStatement(stmt);
          }
        } else {
          this._emitStatement(ifStmt.alternate);
        }

        this.context.indentLevel--;
        this._addLine('}');
      } else {
        this._addLine('}');
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

    case IRNodeType.CALL_EXPRESSION_IR:
      // Expression statement - emit call expression with semicolon
      const callExpr = this._emitExpression(ir);
      this._addLine(`${callExpr};`);
      break;

    case IRNodeType.REGISTRY_REGISTRATION_IR:
    case IRNodeType.REGISTRY_LOOKUP_IR:
      // Skip - handled by component emitter
      break;

    default:
      throw new Error(`Unsupported statement IR type: ${ir.type}`);
  }
}
