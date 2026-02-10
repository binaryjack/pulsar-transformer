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

  // Store current component for debugging
  this.context._currentComponent = name;

  if (this.context.logger) {
    this.context.logger.log('emitter', 'info', `Emitting component: ${name}`, {
      componentName: name,
      paramCount: params.length,
      bodyStatementCount: body.length,
      usesSignals,
    });
  }

  // Add required imports
  this.context.imports.addImport(this.context.config.runtimePaths.registry!, '$REGISTRY');
  if (usesSignals) {
    this.context.imports.addImport(this.context.config.runtimePaths.core!, 'createSignal');
  }

  // Generate function signature with export and return type
  const paramList = params
    .map((p) => {
      if (p.type === IRNodeType.PARAM_PATTERN_IR) {
        // Object destructuring pattern with default values
        const props = (p as any).properties
          .map((prop: any) => {
            if (prop.hasDefault && prop.defaultValue) {
              const defaultExpr = this._emitExpression(prop.defaultValue);
              return `${prop.name} = ${defaultExpr}`;
            }
            return prop.name;
          })
          .join(', ');
        return `{ ${props} }`;
      } else {
        // Simple identifier
        return p.name;
      }
    })
    .join(', ');
  // Browser JavaScript: NO TypeScript return type annotations
  this._addLine(`export function ${name}(${paramList}) {`);
  this.context.indentLevel++;

  // Generate registry wrapper with null parentId
  this._addLine(`return $REGISTRY.execute('${registryKey}', null, () => {`);
  this.context.indentLevel++;

  // Emit body statements
  for (let i = 0; i < body.length; i++) {
    const stmt = body[i];
    if (this.context.logger) {
      this.context.logger.log(
        'emitter',
        'trace',
        `Emitting statement ${i + 1}/${body.length} in component ${name}`,
        {
          statementType: stmt.type,
          index: i,
          component: name,
        }
      );
    }
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
