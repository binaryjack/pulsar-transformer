/**
 * Emit Import
 *
 * Handles import IR nodes by adding them to the import tracker.
 */

import type { IImportIR } from '../../analyzer/ir/index.js';
import type { IEmitterInternal } from '../emitter.types.js';

/**
 * Emit import declaration
 *
 * Adds imported specifiers to the import tracker.
 * The actual import statements are generated later by generateImports().
 */
export function _emitImport(this: IEmitterInternal, ir: IImportIR): void {
  const { source, specifiers } = ir;

  // Handle side-effect imports (no specifiers)
  if (specifiers.length === 0) {
    this.context.imports.addImport(source, null);
    return;
  }

  // Add each specifier to the import tracker
  for (const spec of specifiers) {
    this.context.imports.addImport(source, spec.local);
  }

  // Note: We don't add any code lines here - imports are handled separately
  // in _formatCode() which calls generateImports()
}
