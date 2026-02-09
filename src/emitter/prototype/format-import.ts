/**
 * Format Import Helper
 *
 * Formats a single import statement.
 */

import type { IImportTrackerInternal } from '../emitter.types.js';

/**
 * Transform .psr imports to .js for browser compatibility
 * Strips query parameters (Vite adds these like ?import, ?t=timestamp)
 */
function transformImportPath(source: string): string {
  // Strip query parameters before checking extension
  const [cleanPath, query] = source.split('?', 2);

  if (cleanPath.endsWith('.psr')) {
    // Transform .psr → .js (Vite will add query params automatically)
    return cleanPath.replace(/\.psr$/, '.js');
  }

  // Return clean path without query parameters
  return cleanPath;
}

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
    return `import '${transformImportPath(source)}';`;
  }

  // Filter out null and sort
  const sortedSpecifiers = Array.from(specifiers)
    .filter((spec): spec is string => spec !== null)
    .sort();

  // Check for full statement type import marker
  const isStatementTypeImport = sortedSpecifiers.some((s) => s.startsWith('statement-type:'));

  // CRITICAL: Type-only imports must be stripped for browser execution
  // TypeScript "import type" syntax is not valid JavaScript
  if (isStatementTypeImport) {
    return ''; // Skip type-only imports entirely
  }

  const cleanedSpecifiers = sortedSpecifiers.filter((s) => !s.startsWith('statement-type:'));

  // Handle default import (single specifier, no braces needed in future)
  // For now, we track defaults separately via addImport conventions
  // Default imports use pattern: source→'default:Name'
  // Namespace imports use pattern: source→'namespace:Name'
  // Type imports use pattern: source→'type:Name' for inline type (STRIPPED for browser)

  const defaultImports = cleanedSpecifiers.filter((s) => s.startsWith('default:'));
  const namespaceImports = cleanedSpecifiers.filter((s) => s.startsWith('namespace:'));

  // STRIP inline type imports (e.g., import { type Foo, Bar } - remove the type Foo part)
  const namedImports = cleanedSpecifiers.filter(
    (s) => !s.startsWith('default:') && !s.startsWith('namespace:') && !s.startsWith('type:')
  );

  // If all that remains are type imports, skip the entire import
  if (namedImports.length === 0 && defaultImports.length === 0 && namespaceImports.length === 0) {
    return ''; // All imports were types, skip entirely
  }

  if (namespaceImports.length > 0 && defaultImports.length === 0 && namedImports.length === 0) {
    // Pure namespace import: import * as Name from 'source'
    const namespaceName = namespaceImports[0].substring(10); // Remove 'namespace:' prefix
    return `import * as ${namespaceName} from '${transformImportPath(source)}';`;
  } else if (
    defaultImports.length > 0 &&
    namedImports.length === 0 &&
    namespaceImports.length === 0
  ) {
    // Pure default import: import Name from 'source'
    const defaultName = defaultImports[0].substring(8); // Remove 'default:' prefix
    return `import ${defaultName} from '${transformImportPath(source)}';`;
  } else if (defaultImports.length > 0 && namedImports.length > 0) {
    // Mixed import: import Default, { named } from 'source'
    const defaultName = defaultImports[0].substring(8);
    // Format named imports with alias support (type imports already filtered out)
    const formattedImports = namedImports.map((spec) => {
      if (spec.includes(':as:')) {
        const [imported, , local] = spec.split(':');
        return `${imported} as ${local}`;
      } else {
        return spec;
      }
    });
    const named = formattedImports.join(', ');
    return `import ${defaultName}, { ${named} } from '${transformImportPath(source)}';`;
  } else {
    // Named imports: import { a, b } from 'source'
    // Handle aliases: import { foo as bar }
    // Aliases are encoded as 'imported:as:local'
    const formattedImports = namedImports.map((spec) => {
      if (spec.includes(':as:')) {
        const [imported, , local] = spec.split(':');
        return `${imported} as ${local}`;
      } else {
        return spec;
      }
    });
    const imports = formattedImports.join(', ');
    return `import { ${imports} } from '${transformImportPath(source)}';`;
  }
}
