/**
 * Emit Export Statement
 *
 * Converts export IR to formatted export statements.
 *
 * @example
 * export { foo, bar };
 * export { foo as bar };
 * export * from './utils';
 */

import type { IExportIR } from '../../analyzer/ir/index.js';
import type { IEmitterInternal } from '../emitter.types.js';

/**
 * Emit export statement
 */
export function _emitExport(this: IEmitterInternal, ir: IExportIR): void {
  const { exportKind, specifiers, source } = ir;

  let exportStatement = '';

  // Handle default export
  if (exportKind === 'default') {
    exportStatement = 'export default;';
  }
  // Handle export all
  else if (exportKind === 'all') {
    if (specifiers.length > 0) {
      // export * as name from "module"
      const name = specifiers[0].exported;
      exportStatement = `export * as ${name} from "${source}";`;
    } else {
      // export * from "module"
      exportStatement = `export * from "${source}";`;
    }
  }
  // Handle named exports
  else {
    if (specifiers.length === 0) {
      exportStatement = 'export {};';
    } else {
      const specifierStrings = specifiers.map((spec) => {
        if (spec.exported === spec.local) {
          return spec.local;
        }
        return `${spec.local} as ${spec.exported}`;
      });

      const exportList = specifierStrings.join(', ');

      if (source) {
        // Re-export: export { foo } from "module"
        exportStatement = `export { ${exportList} } from "${source}";`;
      } else {
        // Local export: export { foo }
        exportStatement = `export { ${exportList} };`;
      }
    }
  }

  this._addLine(exportStatement);
}
