/**
 * Emit Expression Helper
 *
 * Generates expression code without side effects (returns string instead of using _addLine).
 * Used for nested expressions within statements (e.g., return value, call arguments).
 */

import type { IIRNode } from '../../analyzer/ir/ir-node-types.js';
import { IRNodeType } from '../../analyzer/ir/ir-node-types.js';
import type { IEmitterInternal } from '../emitter.types.js';

/**
 * Emit expression and return code string
 * Does NOT modify context (no _addLine, no indent changes)
 */
export function _emitExpression(this: IEmitterInternal, ir: IIRNode): string {
  switch (ir.type) {
    case IRNodeType.LITERAL_IR: {
      const literalIR = ir as any;
      const value = literalIR.value;

      if (typeof value === 'string') {
        return JSON.stringify(value);
      } else if (value === null) {
        return 'null';
      } else if (value === undefined) {
        return 'undefined';
      } else if (typeof value === 'boolean' || typeof value === 'number') {
        return String(value);
      } else {
        return JSON.stringify(value);
      }
    }

    case IRNodeType.IDENTIFIER_IR: {
      const identifierIR = ir as any;
      return identifierIR.name;
    }

    case IRNodeType.CALL_EXPRESSION_IR: {
      const callIR = ir as any;

      // Transform signal() to createSignal() in output
      let calleeName = callIR.callee.name;
      if (callIR.isSignalCreation && calleeName === 'signal') {
        calleeName = 'createSignal';
      }

      const args = callIR.arguments.map((arg: IIRNode) => this._emitExpression(arg));
      return `${calleeName}(${args.join(', ')})`;
    }

    case IRNodeType.ELEMENT_IR: {
      const elementIR = ir as any;

      // Add runtime import
      this.context.imports.addImport(this.context.config.runtimePaths.core!, 't_element');

      // Props object from attributes
      const attributes = elementIR.attributes || [];
      const propsStr =
        attributes.length > 0
          ? `{ ${attributes.map((attr: any) => `${attr.name}: ${this._emitExpression(attr.value)}`).join(', ')} }`
          : 'null';

      // Children array
      const children = elementIR.children || [];
      const childrenStr =
        children.length > 0
          ? `[${children.map((c: IIRNode) => this._emitExpression(c)).join(', ')}]`
          : 'null';

      // Return element creation expression
      return `t_element('${elementIR.tagName}', ${propsStr}, ${childrenStr})`;
    }

    default:
      throw new Error(`Unsupported expression IR type: ${ir.type}`);
  }
}
