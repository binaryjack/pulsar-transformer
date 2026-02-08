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
    if (specifiers.length > 0) {
      // Export default with identifier: export default ComponentName;
      const identifier = specifiers[0].local;
      exportStatement = `export default ${identifier};`;
    } else {
      // No identifier provided, emit empty (legacy behavior for compatibility)
      exportStatement = 'export default;';
    }
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
        let specStr = '';

        // Add 'type' keyword for inline type exports
        if (spec.isTypeOnly) {
          specStr = 'type ';
        }

        if (spec.exported === spec.local) {
          specStr += spec.local;
        } else {
          specStr += `${spec.local} as ${spec.exported}`;
        }

        return specStr;
      });

      const exportList = specifierStrings.join(', ');

      // Add 'type' keyword for full statement type exports
      const typePrefix = ir.isTypeOnly ? 'type ' : '';

      if (source) {
        // Re-export: export { foo } from "module" or export type { foo } from "module"
        exportStatement = `export ${typePrefix}{ ${exportList} } from "${source}";`;
      } else {
        // Local export: export { foo } or export type { foo }
        exportStatement = `export ${typePrefix}{ ${exportList} };`;
      }
    }
  }

  this._addLine(exportStatement);
}
