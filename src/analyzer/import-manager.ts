/**
 * Import Manager - Based on SolidJS and Vue Patterns
 *
 * Manages import statements during transformation:
 * - Automatic import injection based on usage
 * - Import deduplication
 * - Lazy/dynamic import handling
 * - Type-only import tracking
 * - Side-effect import preservation
 * - Import hoisting to top of file
 *
 * @see https://github.com/solidjs/solid/blob/main/packages/babel-preset-solid
 * @see https://github.com/vuejs/core/blob/main/packages/compiler-sfc/src/compileTemplate.ts
 */

export interface ImportSpecifier {
  /** Imported name (e.g., 'createSignal' in `import { createSignal }`) */
  imported: string;
  /** Local name (e.g., 'sig' in `import { createSignal as sig }`) */
  local: string;
  /** Type-only import */
  isTypeOnly: boolean;
}

export interface Import {
  /** Source module path */
  source: string;
  /** Import specifiers */
  specifiers: ImportSpecifier[];
  /** Default import name */
  defaultImport?: string;
  /** Namespace import name (e.g., 'as React' in `import * as React`) */
  namespaceImport?: string;
  /** Side-effect only import (e.g., `import './style.css'`) */
  isSideEffect: boolean;
  /** Type-only import (e.g., `import type { Foo }`) */
  isTypeOnly: boolean;
}

export interface DynamicImport {
  /** Unique identifier for this dynamic import */
  id: string;
  /** Source module path */
  source: string;
  /** Specifiers to import */
  specifiers?: string[];
  /** Is this a lazy/async import */
  isLazy: boolean;
}

export interface ImportManager {
  /** Add a named import */
  addNamedImport(name: string, source: string, alias?: string): string;

  /** Add a default import */
  addDefaultImport(name: string, source: string): string;

  /** Add a namespace import */
  addNamespaceImport(name: string, source: string): string;

  /** Add a type-only import */
  addTypeImport(name: string, source: string, alias?: string): string;

  /** Add a side-effect import */
  addSideEffectImport(source: string): void;

  /** Add a dynamic/lazy import */
  addDynamicImport(source: string, specifiers?: string[]): DynamicImport;

  /** Check if import already exists */
  hasImport(name: string, source: string): boolean;

  /** Get local name for imported binding */
  getLocalName(name: string, source: string): string | undefined;

  /** Get all imports */
  getImports(): Import[];

  /** Get all dynamic imports */
  getDynamicImports(): DynamicImport[];

  /** Generate import statements */
  generateImportStatements(): string[];

  /** Generate dynamic import helpers */
  generateDynamicImportHelpers(): string[];

  /** Merge duplicate imports */
  deduplicateImports(): void;

  /** Reset all imports */
  clear(): void;
}

/**
 * Create import manager instance
 */
export function createImportManager(): ImportManager {
  const imports = new Map<string, Import>();
  const dynamicImports: DynamicImport[] = [];
  let dynamicImportCounter = 0;

  return {
    addNamedImport(name: string, source: string, alias?: string): string {
      const localName = alias || name;

      let importEntry = imports.get(source);
      if (!importEntry) {
        importEntry = {
          source,
          specifiers: [],
          isSideEffect: false,
          isTypeOnly: false,
        };
        imports.set(source, importEntry);
      }

      // Check if already imported
      const existing = importEntry.specifiers.find(
        (s) => s.imported === name && s.local === localName
      );

      if (!existing) {
        importEntry.specifiers.push({
          imported: name,
          local: localName,
          isTypeOnly: false,
        });
      }

      return localName;
    },

    addDefaultImport(name: string, source: string): string {
      let importEntry = imports.get(source);
      if (!importEntry) {
        importEntry = {
          source,
          specifiers: [],
          isSideEffect: false,
          isTypeOnly: false,
        };
        imports.set(source, importEntry);
      }

      if (!importEntry.defaultImport) {
        importEntry.defaultImport = name;
      }

      return importEntry.defaultImport;
    },

    addNamespaceImport(name: string, source: string): string {
      let importEntry = imports.get(source);
      if (!importEntry) {
        importEntry = {
          source,
          specifiers: [],
          isSideEffect: false,
          isTypeOnly: false,
        };
        imports.set(source, importEntry);
      }

      if (!importEntry.namespaceImport) {
        importEntry.namespaceImport = name;
      }

      return importEntry.namespaceImport;
    },

    addTypeImport(name: string, source: string, alias?: string): string {
      const localName = alias || name;

      let importEntry = imports.get(source);
      if (!importEntry) {
        importEntry = {
          source,
          specifiers: [],
          isSideEffect: false,
          isTypeOnly: false,
        };
        imports.set(source, importEntry);
      }

      // Check if already imported
      const existing = importEntry.specifiers.find(
        (s) => s.imported === name && s.local === localName
      );

      if (!existing) {
        importEntry.specifiers.push({
          imported: name,
          local: localName,
          isTypeOnly: true,
        });
      }

      return localName;
    },

    addSideEffectImport(source: string): void {
      if (!imports.has(source)) {
        imports.set(source, {
          source,
          specifiers: [],
          isSideEffect: true,
          isTypeOnly: false,
        });
      }
    },

    addDynamicImport(source: string, specifiers?: string[]): DynamicImport {
      const id = `__dynamic_import_${dynamicImportCounter++}`;

      const dynamicImport: DynamicImport = {
        id,
        source,
        specifiers,
        isLazy: true,
      };

      dynamicImports.push(dynamicImport);
      return dynamicImport;
    },

    hasImport(name: string, source: string): boolean {
      const importEntry = imports.get(source);
      if (!importEntry) return false;

      if (importEntry.defaultImport === name) return true;
      if (importEntry.namespaceImport === name) return true;

      return importEntry.specifiers.some((s) => s.imported === name || s.local === name);
    },

    getLocalName(name: string, source: string): string | undefined {
      const importEntry = imports.get(source);
      if (!importEntry) return undefined;

      if (importEntry.defaultImport === name) return name;
      if (importEntry.namespaceImport === name) return name;

      const specifier = importEntry.specifiers.find((s) => s.imported === name);
      return specifier?.local;
    },

    getImports(): Import[] {
      return Array.from(imports.values());
    },

    getDynamicImports(): DynamicImport[] {
      return dynamicImports;
    },

    generateImportStatements(): string[] {
      const statements: string[] = [];

      // Sort imports: side-effects first, then by source path
      const sortedImports = Array.from(imports.values()).sort((a, b) => {
        if (a.isSideEffect && !b.isSideEffect) return -1;
        if (!a.isSideEffect && b.isSideEffect) return 1;
        return a.source.localeCompare(b.source);
      });

      for (const imp of sortedImports) {
        // Side-effect only
        if (imp.isSideEffect && !imp.specifiers.length && !imp.defaultImport) {
          statements.push(`import '${imp.source}';`);
          continue;
        }

        // Type-only import
        if (imp.isTypeOnly) {
          const specifierStr = imp.specifiers
            .map((s) => (s.imported === s.local ? s.imported : `${s.imported} as ${s.local}`))
            .join(', ');

          statements.push(`import type { ${specifierStr} } from '${imp.source}';`);
          continue;
        }

        const parts: string[] = [];

        // Default import
        if (imp.defaultImport) {
          parts.push(imp.defaultImport);
        }

        // Namespace import
        if (imp.namespaceImport) {
          parts.push(`* as ${imp.namespaceImport}`);
        }

        // Named imports (separate type and value)
        const typeSpecifiers = imp.specifiers.filter((s) => s.isTypeOnly);
        const valueSpecifiers = imp.specifiers.filter((s) => !s.isTypeOnly);

        if (valueSpecifiers.length > 0) {
          const specifierStr = valueSpecifiers
            .map((s) => (s.imported === s.local ? s.imported : `${s.imported} as ${s.local}`))
            .join(', ');

          parts.push(`{ ${specifierStr} }`);
        }

        // Type-only named imports
        if (typeSpecifiers.length > 0) {
          const specifierStr = typeSpecifiers
            .map((s) => (s.imported === s.local ? s.imported : `${s.imported} as ${s.local}`))
            .join(', ');

          parts.push(`{ type ${specifierStr} }`);
        }

        statements.push(`import ${parts.join(', ')} from '${imp.source}';`);
      }

      return statements;
    },

    generateDynamicImportHelpers(): string[] {
      const helpers: string[] = [];

      for (const dynamicImport of dynamicImports) {
        if (dynamicImport.specifiers && dynamicImport.specifiers.length > 0) {
          // Generate: const { foo, bar } = await import('./module');
          const specifiers = dynamicImport.specifiers.join(', ');
          helpers.push(
            `const ${dynamicImport.id} = (async () => {` +
              `  const { ${specifiers} } = await import('${dynamicImport.source}');` +
              `  return { ${specifiers} };` +
              `})();`
          );
        } else {
          // Generate: const module = await import('./module');
          helpers.push(`const ${dynamicImport.id} = import('${dynamicImport.source}');`);
        }
      }

      return helpers;
    },

    deduplicateImports(): void {
      // Merge imports from same source
      const merged = new Map<string, Import>();

      for (const [source, imp] of imports) {
        let existing = merged.get(source);

        if (!existing) {
          existing = {
            source,
            specifiers: [],
            isSideEffect: imp.isSideEffect,
            isTypeOnly: imp.isTypeOnly,
          };
          merged.set(source, existing);
        }

        // Merge default
        if (imp.defaultImport) {
          existing.defaultImport = imp.defaultImport;
        }

        // Merge namespace
        if (imp.namespaceImport) {
          existing.namespaceImport = imp.namespaceImport;
        }

        // Merge specifiers (deduplicate)
        for (const spec of imp.specifiers) {
          const hasDuplicate = existing.specifiers.some(
            (s) => s.imported === spec.imported && s.local === spec.local
          );

          if (!hasDuplicate) {
            existing.specifiers.push(spec);
          }
        }
      }

      imports.clear();
      for (const [source, imp] of merged) {
        imports.set(source, imp);
      }
    },

    clear(): void {
      imports.clear();
      dynamicImports.length = 0;
      dynamicImportCounter = 0;
    },
  };
}

/**
 * Runtime import paths for Pulsar
 */
export const RUNTIME_IMPORTS = {
  // Core reactivity
  createSignal: '@pulsar/runtime',
  createMemo: '@pulsar/runtime',
  createEffect: '@pulsar/runtime',
  createResource: '@pulsar/runtime',
  batch: '@pulsar/runtime',
  untrack: '@pulsar/runtime',

  // JSX runtime
  Fragment: '@pulsar/runtime/jsx-runtime',
  jsx: '@pulsar/runtime/jsx-runtime',
  jsxs: '@pulsar/runtime/jsx-runtime',
  jsxDEV: '@pulsar/runtime/jsx-dev-runtime',

  // DOM helpers
  template: '@pulsar/runtime/dom',
  insert: '@pulsar/runtime/dom',
  spread: '@pulsar/runtime/dom',
  delegateEvents: '@pulsar/runtime/dom',

  // Registry
  register: '@pulsar/runtime/registry',
  execute: '@pulsar/runtime/registry',
} as const;

/**
 * Get runtime import path for a given identifier
 */
export function getRuntimeImportPath(name: string): string | undefined {
  return RUNTIME_IMPORTS[name as keyof typeof RUNTIME_IMPORTS];
}
