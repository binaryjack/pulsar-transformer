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

  // Check for full statement type import marker
  const isStatementTypeImport = sortedSpecifiers.some((s) => s.startsWith('statement-type:'));
  const cleanedSpecifiers = sortedSpecifiers.filter((s) => !s.startsWith('statement-type:'));

  // Handle default import (single specifier, no braces needed in future)
  // For now, we track defaults separately via addImport conventions
  // Default imports use pattern: source→'default:Name'
  // Namespace imports use pattern: source→'namespace:Name'
  // Type imports use pattern: source→'type:Name' for inline type
  // Check if any specifier starts with 'default:', 'namespace:', or 'type:'
  const defaultImports = cleanedSpecifiers.filter((s) => s.startsWith('default:'));
  const namespaceImports = cleanedSpecifiers.filter((s) => s.startsWith('namespace:'));
  const typePrefix = isStatementTypeImport ? 'type ' : '';
  const namedImports = cleanedSpecifiers.filter(
    (s) => !s.startsWith('default:') && !s.startsWith('namespace:') && !s.startsWith('type:')
  );
  const typeImports = cleanedSpecifiers.filter((s) => s.startsWith('type:'));

  if (
    namespaceImports.length > 0 &&
    defaultImports.length === 0 &&
    namedImports.length === 0 &&
    typeImports.length === 0
  ) {
    // Pure namespace import: import * as Name from 'source'
    const namespaceName = namespaceImports[0].substring(10); // Remove 'namespace:' prefix
    return `import ${typePrefix}* as ${namespaceName} from '${source}';`;
  } else if (
    defaultImports.length > 0 &&
    namedImports.length === 0 &&
    namespaceImports.length === 0 &&
    typeImports.length === 0
  ) {
    // Pure default import: import Name from 'source'
    const defaultName = defaultImports[0].substring(8); // Remove 'default:' prefix
    return `import ${typePrefix}${defaultName} from '${source}';`;
  } else if (defaultImports.length > 0 && (namedImports.length > 0 || typeImports.length > 0)) {
    // Mixed import: import Default, { named } from 'source'
    const defaultName = defaultImports[0].substring(8);
    // Format named imports with alias support and type keyword
    const allNamed = [...namedImports, ...typeImports];
    const formattedImports = allNamed.map((spec) => {
      let formatted = '';

      // Handle type: prefix
      if (spec.startsWith('type:')) {
        formatted = 'type ';
        spec = spec.substring(5);
      }

      if (spec.includes(':as:')) {
        const [imported, , local] = spec.split(':');
        formatted += `${imported} as ${local}`;
      } else {
        formatted += spec;
      }
      return formatted;
    });
    const named = formattedImports.join(', ');
    return `import ${typePrefix}${defaultName}, { ${named} } from '${source}';`;
  } else {
    // Named imports: import { a, b } from 'source'
    // Handle aliases: import { foo as bar }
    // Aliases are encoded as 'imported:as:local'
    // Handle type: prefix for inline type imports
    const allNamed = [...namedImports, ...typeImports];
    const formattedImports = allNamed.map((spec) => {
      let formatted = '';

      // Handle type: prefix
      if (spec.startsWith('type:')) {
        formatted = 'type ';
        spec = spec.substring(5);
      }

      if (spec.includes(':as:')) {
        const [imported, , local] = spec.split(':');
        formatted += `${imported} as ${local}`;
      } else {
        formatted += spec;
      }
      return formatted;
    });
    const imports = formattedImports.join(', ');
    return `import ${typePrefix}{ ${imports} } from '${source}';`;
  }
}
