/**
 * Emit Method
 *
 * Main entry point for code generation.
 */

import type { IIRNode } from '../../analyzer/ir/ir-node-types.js';
import { IRNodeType } from '../../analyzer/ir/ir-node-types.js';
import type { IEmitterInternal } from '../emitter.types.js';

/**
 * Emit code from IR
 */
export function emit(this: IEmitterInternal, ir: IIRNode): string {
  // Reset state
  this.context.code = [];
  this.context.usedNames.clear();
  this.context.indentLevel = 0;
  this.context._debugIterationCount = 0;

  // Emit based on IR type
  switch (ir.type) {
    case IRNodeType.COMPONENT_IR:
      this._emitComponent(ir);
      break;
    case IRNodeType.ELEMENT_IR:
      this._emitElement(ir);
      break;
    case IRNodeType.SIGNAL_BINDING_IR:
      this._emitSignalBinding(ir);
      break;
    case IRNodeType.EVENT_HANDLER_IR:
      this._emitEventHandler(ir);
      break;
    case IRNodeType.IMPORT:
      this._emitImport(ir);
      break;
    case IRNodeType.EXPORT:
      this._emitExport(ir);
      break;
    case IRNodeType.VARIABLE_DECLARATION_IR:
      this._emitVariableDeclaration(ir);
      break;
    case IRNodeType.RETURN_STATEMENT_IR:
      // Return statement - emit the value
      const returnIR = ir as any;
      if (returnIR.value) {
        const expr = this._emitExpression(returnIR.value);
        this._addLine(`return ${expr};`);
      } else {
        this._addLine('return;');
      }
      break;
    case IRNodeType.LITERAL_IR:
      this._emitLiteral(ir);
      break;
    case IRNodeType.IDENTIFIER_IR:
      this._emitIdentifier(ir);
      break;
    case IRNodeType.CALL_EXPRESSION_IR:
      this._emitCallExpression(ir);
      break;
    case IRNodeType.ARROW_FUNCTION_IR:
      this._emitArrowFunction(ir);
      break;
    case IRNodeType.REGISTRY_REGISTRATION_IR:
    case IRNodeType.REGISTRY_LOOKUP_IR:
      // Skip - these are handled by component emitter
      break;
    case IRNodeType.PROGRAM_IR:
      // Handle program with multiple statements
      const programIR = ir as any;
      if (programIR.children && Array.isArray(programIR.children)) {
        for (const node of programIR.children) {
          // Skip non-statement IR nodes (like IdentifierIR)
          if (
            node.type === IRNodeType.IDENTIFIER_IR ||
            node.type === IRNodeType.LITERAL_IR ||
            node.type === IRNodeType.CALL_EXPRESSION_IR
          ) {
            continue;
          }

          this._emitStatement(node);
        }
      }
      break;
    default:
      throw new Error(`Unsupported IR node type: ${(ir as any).type}`);
  }

  // Format and return code
  return this._formatCode();
}
