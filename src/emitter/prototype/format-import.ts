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
  specifiers: Set<string | null>
): string {
  // Handle side-effect imports (no specifiers)
  if (specifiers.has(null) && specifiers.size === 1) {
    return `import '${source}';`;
  }

  // Filter out null and sort
  const sortedSpecifiers = Array.from(specifiers)
    .filter((spec): spec is string => spec !== null)
    .sort();
  const imports = sortedSpecifiers.join(', ');

  return `import { ${imports} } from '${source}';`;
}
