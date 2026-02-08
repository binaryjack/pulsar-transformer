/**
 * Emit Expression Helper
 *
 * Generates expression code without side effects (returns string instead of using _addLine).
 * Used for nested expressions within statements (e.g., return value, call arguments).
 */

import type { IIRNode } from '../../analyzer/ir/ir-node-types.js';
import { IRNodeType } from '../../analyzer/ir/ir-node-types.js';
import { escapeStringLiteral, needsUnicodeEscape } from '../../transformer/unicode-escaper.js';
import type { IEmitterInternal } from '../emitter.types.js';

/**
 * Emit expression and return code string
 * Does NOT modify context (no _addLine, no indent changes)
 */
export function _emitExpression(this: IEmitterInternal, ir: IIRNode): string {
  // Increment iteration counter with safety check
  if (
    this.context._debugIterationCount !== undefined &&
    this.context._maxIterations !== undefined
  ) {
    this.context._debugIterationCount++;

    // Log every 1000 iterations
    if (this.context._debugIterationCount % 1000 === 0) {
      console.log(
        `[EMITTER DEBUG] Iteration ${this.context._debugIterationCount} - Node type: ${ir.type}`
      );
    }

    // Safety check - prevent infinite loops
    if (this.context._debugIterationCount > this.context._maxIterations) {
      throw new Error(
        `[EMITTER] Exceeded maximum iterations (${this.context._maxIterations}). ` +
          `Last node type: ${ir.type}. Possible infinite loop detected.`
      );
    }
  }

  switch (ir.type) {
    case IRNodeType.LITERAL_IR: {
      const literalIR = ir as any;
      const value = literalIR.value;

      // Check if this is an ObjectExpression or ArrayExpression passthrough
      if (
        literalIR.metadata?.isObjectExpression &&
        value &&
        typeof value === 'object' &&
        value.type === 'ObjectExpression'
      ) {
        // Emit object literal { key: value, ... }
        const properties = value.properties || [];
        if (properties.length === 0) {
          return '{}';
        }
        const props = properties.map((prop: any) => {
          if (prop.type === 'SpreadElement') {
            const argExpr = this._emitExpression(prop.argument);
            return `...${argExpr}`;
          }
          const keyName = prop.key.name;
          const valueExpr = this._emitExpression(prop.value);
          return `${keyName}: ${valueExpr}`;
        });
        return `{ ${props.join(', ')} }`;
      }

      if (
        literalIR.metadata?.isArrayExpression &&
        value &&
        typeof value === 'object' &&
        value.type === 'ArrayExpression'
      ) {
        // Emit array literal [element1, element2, ...]
        const elements = value.elements || [];
        if (elements.length === 0) {
          return '[]';
        }
        const items = elements.map((elem: any) => {
          if (elem.type === 'SpreadElement') {
            const argExpr = this._emitExpression(elem.argument);
            return `...${argExpr}`;
          }
          return this._emitExpression(elem);
        });
        return `[${items.join(', ')}]`;
      }

      if (typeof value === 'string') {
        // Check if unicode escaping is needed
        if (needsUnicodeEscape(value)) {
          return escapeStringLiteral(value);
        }
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

      const args = callIR.arguments
        .map((arg: IIRNode) => this._emitExpression(arg))
        .filter((arg: string | null) => arg !== null);
      return `${calleeName}(${args.join(', ')})`;
    }

    case IRNodeType.BINARY_EXPRESSION_IR: {
      const binaryIR = ir as any;
      const left = this._emitExpression(binaryIR.left);
      const right = this._emitExpression(binaryIR.right);
      return `(${left} ${binaryIR.operator} ${right})`;
    }

    case IRNodeType.UNARY_EXPRESSION_IR: {
      const unaryIR = ir as any;
      const argument = this._emitExpression(unaryIR.argument);
      // Prefix operators: !, -, +, ~, typeof, void, delete
      // Postfix operators: ++, --
      if (unaryIR.prefix !== false) {
        return `(${unaryIR.operator}${argument})`;
      } else {
        return `(${argument}${unaryIR.operator})`;
      }
    }

    case IRNodeType.MEMBER_EXPRESSION_IR: {
      const memberIR = ir as any;
      const object = this._emitExpression(memberIR.object);
      const property = this._emitExpression(memberIR.property);

      // Use bracket notation for computed access, dot notation for non-computed
      if (memberIR.computed) {
        return `${object}[${property}]`;
      } else {
        return `${object}.${property}`;
      }
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
      const componentName = componentCallIR.componentName;
      const attributes = componentCallIR.attributes || [];
      const children = componentCallIR.children || [];

      // Build props object from attributes
      const propPairs: string[] = attributes.map((attr: any) => {
        const value =
          attr.value?.value === undefined
            ? this._emitExpression(attr.value)
            : JSON.stringify(attr.value.value);
        return `${attr.name}: ${value}`;
      });

      // Add children prop if there are children
      if (children.length > 0) {
        const childrenExprs = children.map((child: any) => this._emitExpression(child)).join(', ');
        propPairs.push(`children: [${childrenExprs}]`);
      }

      // Emit component call with props object
      if (propPairs.length > 0) {
        return `${componentName}({ ${propPairs.join(', ')} })`;
      } else {
        return `${componentName}({})`;
      }
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

      // Generate: (el => { el.onclick = ...; el.append(...children); return el; })(t_element('tag', {...}))
      if (children.length > 0 || (elementIR.eventHandlers && elementIR.eventHandlers.length > 0)) {
        const childExprs = children
          .map((c: IIRNode) => {
            const childExpr = this._emitExpression(c);
            if (!childExpr) return null; // Skip null expressions
            // Only wrap strings (LiteralIR) in Text nodes, not elements
            if (c.type === IRNodeType.LITERAL_IR) {
              return `document.createTextNode(${childExpr})`;
            }
            return childExpr;
          })
          .filter((expr: string | null) => expr !== null)
          .join(', ');

        // Build IIFE body statements
        const iifeStatements: string[] = [];

        // Add event handlers
        if (elementIR.eventHandlers && elementIR.eventHandlers.length > 0) {
          for (const handler of elementIR.eventHandlers) {
            const handlerCode = this._emitExpression(handler.handler);
            // Use .onclick property (simpler than addEventListener for inline handlers)
            iifeStatements.push(`${elVar}.on${handler.eventName} = ${handlerCode};`);
          }
        }

        // Add append if children exist
        if (childExprs) {
          iifeStatements.push(`${elVar}.append(${childExprs});`);
        }

        // Add return
        iifeStatements.push(`return ${elVar};`);

        return `((${elVar}) => { ${iifeStatements.join(' ')} })(t_element('${elementIR.tagName}', ${propsStr}))`;
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
