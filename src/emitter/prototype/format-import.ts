/**
 * Format Import Helper
 *
 * Formats a single import statement.
 */

import type { IImportTrackerInternal } from '../emitter.types.js';

/**
 * Format import statement
 */
export function _formatImport(
  this: IImportTrackerInternal,
  source: string,
  specifiers: Set<string>
): string {
  const sortedSpecifiers = Array.from(specifiers).sort();
  const imports = sortedSpecifiers.join(', ');

  return `import { ${imports} } from '${source}';`;
}
