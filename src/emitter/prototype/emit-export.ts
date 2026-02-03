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

import type { IEmitterInternal } from '../emitter.types.js';
import type { IExportIR } from '../../analyzer/ir/index.js';

/**
 * Emit export statement
 */
export function emitExport(this: IEmitterInternal, exportIR: IExportIR): string {
  const { exportKind, specifiers, source } = exportIR;

  // Handle default export
  if (exportKind === 'default') {
    return 'export default';
  }

  // Handle export all
  if (exportKind === 'all') {
    if (specifiers.length > 0) {
      // export * as name from "module"
      const name = specifiers[0].exported;
      return `export * as ${name} from "${source}"`;
    }
    // export * from "module"
    return `export * from "${source}"`;
  }

  // Handle named exports
  if (specifiers.length === 0) {
    return 'export {}';
  }

  const specifierStrings = specifiers.map((spec) => {
    if (spec.exported === spec.local) {
      return spec.local;
    }
    return `${spec.local} as ${spec.exported}`;
  });

  const exportList = specifierStrings.join(', ');

  if (source) {
    // Re-export: export { foo } from "module"
    return `export { ${exportList} } from "${source}"`;
  }

  // Local export: export { foo }
  return `export { ${exportList} }`;
}
