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

  // Handle default import (single specifier, no braces needed in future)
  // For now, we track defaults separately via addImport conventions
  // Default imports use pattern: source→'default:Name'
  // Namespace imports use pattern: source→'namespace:Name'
  // Check if any specifier starts with 'default:' or 'namespace:'
  const defaultImports = sortedSpecifiers.filter((s) => s.startsWith('default:'));
  const namespaceImports = sortedSpecifiers.filter((s) => s.startsWith('namespace:'));
  const namedImports = sortedSpecifiers.filter(
    (s) => !s.startsWith('default:') && !s.startsWith('namespace:')
  );

  if (namespaceImports.length > 0 && defaultImports.length === 0 && namedImports.length === 0) {
    // Pure namespace import: import * as Name from 'source'
    const namespaceName = namespaceImports[0].substring(10); // Remove 'namespace:' prefix
    return `import * as ${namespaceName} from '${source}';`;
  } else if (
    defaultImports.length > 0 &&
    namedImports.length === 0 &&
    namespaceImports.length === 0
  ) {
    // Pure default import: import Name from 'source'
    const defaultName = defaultImports[0].substring(8); // Remove 'default:' prefix
    return `import ${defaultName} from '${source}';`;
  } else if (defaultImports.length > 0 && namedImports.length > 0) {
    // Mixed import: import Default, { named } from 'source'
    const defaultName = defaultImports[0].substring(8);
    // Format named imports with alias support
    const formattedImports = namedImports.map((spec) => {
      if (spec.includes(':as:')) {
        const [imported, , local] = spec.split(':');
        return `${imported} as ${local}`;
      }
      return spec;
    });
    const named = formattedImports.join(', ');
    return `import ${defaultName}, { ${named} } from '${source}';`;
  } else {
    // Named imports: import { a, b } from 'source'
    // Handle aliases: import { foo as bar }
    // Aliases are encoded as 'imported:as:local'
    const formattedImports = namedImports.map((spec) => {
      if (spec.includes(':as:')) {
        const [imported, , local] = spec.split(':');
        return `${imported} as ${local}`;
      }
      return spec;
    });
    const imports = formattedImports.join(', ');
    return `import { ${imports} } from '${source}';`;
  }
}
