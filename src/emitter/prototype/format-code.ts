/**
 * Format Code Helper Method
 *
 * Formats final output code with imports.
 */

import type { IEmitterInternal } from '../emitter.types.js';

/**
 * Format final code
 */
export function _formatCode(this: IEmitterInternal): string {
  const parts: string[] = [];

  // Add imports
  const imports = this.context.imports.generateImports();
  if (imports) {
    parts.push(imports);
    parts.push(''); // Blank line after imports
  }

  // Add generated code
  parts.push(this.context.code.join('\n'));

  return parts.join('\n');
}
