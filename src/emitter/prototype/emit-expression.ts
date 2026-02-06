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
      const calleeExpr = this._emitExpression(callIR.callee);
      let calleeName = calleeExpr;
      if (callIR.isSignalCreation && calleeExpr === 'signal') {
        calleeName = 'createSignal';
      }

      const args = callIR.arguments.map((arg: IIRNode) => this._emitExpression(arg));
      return `${calleeName}(${args.join(', ')})`;
    }

    case IRNodeType.BINARY_EXPRESSION_IR: {
      const binaryIR = ir as any;
      const left = this._emitExpression(binaryIR.left);
      const right = this._emitExpression(binaryIR.right);
      return `(${left} ${binaryIR.operator} ${right})`;
    }

    case IRNodeType.MEMBER_EXPRESSION_IR: {
      const memberIR = ir as any;
      const object = this._emitExpression(memberIR.object);
      const property = this._emitExpression(memberIR.property);
      return `${object}.${property}`;
    }

    case IRNodeType.CONDITIONAL_EXPRESSION_IR: {
      const conditionalIR = ir as any;
      const test = this._emitExpression(conditionalIR.test);
      const consequent = this._emitExpression(conditionalIR.consequent);
      const alternate = this._emitExpression(conditionalIR.alternate);
      return `(${test} ? ${consequent} : ${alternate})`;
    }

    case IRNodeType.COMPONENT_CALL_IR: {
      const componentCallIR = ir as any;

      // Generate component function call: ComponentName()
      // NOTE: Components in the same file can be called directly.
      // Imported components are resolved through the import system and can be called the same way.
      // Proper module resolution is handled by the import tracker.
      const componentName = componentCallIR.componentName;

      // Components are directly callable functions that return HTMLElement
      // Attributes and children will be passed as props later when we implement props system
      return `${componentName}()`;
    }

    case IRNodeType.ELEMENT_IR: {
      const elementIR = ir as any;

      // Add runtime import
      this.context.imports.addImport(this.context.config.runtimePaths.jsxRuntime!, 't_element');

      // Props object from attributes
      const attributes = elementIR.attributes || [];
      const propsStr =
        attributes.length > 0
          ? `{ ${attributes
              .map((attr: any) => {
                const value =
                  attr.value?.value === undefined
                    ? this._emitExpression(attr.value)
                    : JSON.stringify(attr.value.value);
                return `${attr.name}: ${value}`;
              })
              .join(', ')} }`
          : '{}';

      // Children array
      const children = elementIR.children || [];

      // Create element first
      const elVar = `_el${this.context.elementCounter++}`;

      // Generate: (el => { el.append(...children); return el; })(t_element('tag', {...}))
      if (children.length > 0) {
        const childExprs = children
          .map((c: IIRNode) => {
            const childExpr = this._emitExpression(c);
            // Only wrap strings (LiteralIR) in Text nodes, not elements
            if (c.type === IRNodeType.LITERAL_IR) {
              return `document.createTextNode(${childExpr})`;
            }
            return childExpr;
          })
          .join(', ');

        return `((${elVar}) => { ${elVar}.append(${childExprs}); return ${elVar}; })(t_element('${elementIR.tagName}', ${propsStr}))`;
      } else {
        return `t_element('${elementIR.tagName}', ${propsStr})`;
      }
    }

    case IRNodeType.ARROW_FUNCTION_IR: {
      const arrowIR = ir as any;

      // Generate parameter list
      const params = arrowIR.params.map((p: any) => p.name).join(', ');

      // Generate body
      let bodyCode: string;
      if (Array.isArray(arrowIR.body)) {
        // Block body: () => { statements }
        if (arrowIR.body.length === 0) {
          bodyCode = '{}';
        } else {
          // For block bodies, we need to emit statements properly
          // Collect statement code by temporarily capturing output
          const savedCode = [...this.context.code];
          this.context.code = [];

          try {
            arrowIR.body.forEach((stmt: IIRNode) => {
              this._emitStatement(stmt);
            });

            // Get all emitted lines
            const bodyLines = this.context.code;

            if (bodyLines.length === 0) {
              bodyCode = '{}';
            } else if (bodyLines.length === 1) {
              // Single statement - keep on one line for readability
              bodyCode = `{ ${bodyLines[0]} }`;
            } else {
              // Multiple statements - format on separate lines
              const indent = '  '.repeat(this.context.indentLevel + 1);
              const indentedBody = bodyLines.map((line) => `${indent}${line}`).join('\n');
              const closeIndent = '  '.repeat(this.context.indentLevel);
              bodyCode = `{\n${indentedBody}\n${closeIndent}}`;
            }
          } finally {
            // Restore saved context
            this.context.code = savedCode;
          }
        }
      } else if (arrowIR.body) {
        // Expression body: () => expression
        bodyCode = this._emitExpression(arrowIR.body);
      } else {
        // No body - empty function
        bodyCode = '{}';
      }

      return `(${params}) => ${bodyCode}`;
    }

    default:
      throw new Error(`Unsupported expression IR type: ${ir.type}`);
  }
}
