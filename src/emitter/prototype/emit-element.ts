/**
 * Emit Element Method
 *
 * Generates code for ElementIR nodes.
 */

import type { IElementIR } from '../../analyzer/ir/ir-node-types.js';
import type { IEmitterInternal } from '../emitter.types.js';

/**
 * Emit element creation (t_element call)
 */
export function _emitElement(this: IEmitterInternal, ir: IElementIR): void {
  const { tagName, attributes, children } = ir;

  // Add import
  this.context.imports.addImport(this.context.config.runtimePaths.jsxRuntime!, 't_element');

  // Generate unique variable name
  const varName = this._generateUniqueName(`${tagName}_`);

  // Generate attributes object
  const attrsObj: Record<string, unknown> = {};
  if (attributes) {
    for (const attr of attributes) {
      if (attr.isStatic && attr.value) {
        attrsObj[attr.name] = attr.value;
      }
    }
  }
  const attrsStr =
    Object.keys(attrsObj).length > 0
      ? `{ ${Object.entries(attrsObj)
          .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
          .join(', ')} }`
      : 'null';

  // Emit element creation
  this._addLine(`const ${varName} = t_element('${tagName}', ${attrsStr});`);

  // Emit children if present
  if (children && children.length > 0) {
    for (const child of children) {
      this.emit(child);
    }
  }
}
