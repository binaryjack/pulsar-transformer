/**
 * Emitter Integration - Import Manager
 *
 * Integrates import manager into emitter.
 * Handles automatic import injection, deduplication, and generation.
 */

import {
  createImportManager,
  getRuntimeImportPath,
  type Import,
  type ImportManager,
} from '../analyzer/import-manager.js';

/**
 * Emitter with import management capabilities
 */
export interface EmitterWithImports {
  /** Import manager instance */
  imports: ImportManager;

  /** Auto-inject runtime import if needed */
  ensureRuntimeImport(name: string): string;

  /** Generate all import statements */
  generateImports(): string;

  /** Check if identifier needs runtime import */
  needsRuntimeImport(name: string): boolean;
}

/**
 * Create emitter with import management
 */
export function createEmitterWithImports(): EmitterWithImports {
  const imports = createImportManager();

  return {
    imports,

    ensureRuntimeImport(name: string): string {
      const runtimePath = getRuntimeImportPath(name);

      if (!runtimePath) {
        throw new Error(`No runtime import path found for: ${name}`);
      }

      if (!imports.hasImport(name, runtimePath)) {
        return imports.addNamedImport(name, runtimePath);
      }

      return imports.getLocalName(name, runtimePath) || name;
    },

    generateImports(): string {
      // Deduplicate before generating
      imports.deduplicateImports();

      const statements = imports.generateImportStatements();
      return statements.join('\n');
    },

    needsRuntimeImport(name: string): boolean {
      const runtimePath = getRuntimeImportPath(name);
      return runtimePath !== undefined;
    },
  };
}

/**
 * Auto-inject runtime imports based on code analysis
 */
export function autoInjectRuntimeImports(code: string, imports: ImportManager): void {
  // JSX runtime
  if (/\bjsx\(/.test(code) || /\bjsxs\(/.test(code)) {
    imports.addNamedImport('jsx', '@pulsar/runtime/jsx-runtime');
    imports.addNamedImport('jsxs', '@pulsar/runtime/jsx-runtime');
  }

  if (/\bjsxDEV\(/.test(code)) {
    imports.addNamedImport('jsxDEV', '@pulsar/runtime/jsx-dev-runtime');
  }

  if (/\bFragment\b/.test(code)) {
    imports.addNamedImport('Fragment', '@pulsar/runtime/jsx-runtime');
  }

  // Reactivity
  if (/\bcreateSignal\(/.test(code)) {
    imports.addNamedImport('createSignal', '@pulsar/runtime');
  }

  if (/\bcreateMemo\(/.test(code)) {
    imports.addNamedImport('createMemo', '@pulsar/runtime');
  }

  if (/\bcreateEffect\(/.test(code)) {
    imports.addNamedImport('createEffect', '@pulsar/runtime');
  }

  if (/\bcreateResource\(/.test(code)) {
    imports.addNamedImport('createResource', '@pulsar/runtime');
  }

  if (/\bbatch\(/.test(code)) {
    imports.addNamedImport('batch', '@pulsar/runtime');
  }

  if (/\buntrack\(/.test(code)) {
    imports.addNamedImport('untrack', '@pulsar/runtime');
  }

  // DOM helpers
  if (/\btemplate\(/.test(code)) {
    imports.addNamedImport('template', '@pulsar/runtime/dom');
  }

  if (/\binsert\(/.test(code)) {
    imports.addNamedImport('insert', '@pulsar/runtime/dom');
  }

  if (/\bspread\(/.test(code)) {
    imports.addNamedImport('spread', '@pulsar/runtime/dom');
  }

  if (/\bdelegateEvents\(/.test(code)) {
    imports.addNamedImport('delegateEvents', '@pulsar/runtime/dom');
  }

  // Registry
  if (/\bregister\(/.test(code)) {
    imports.addNamedImport('register', '@pulsar/runtime/registry');
  }

  if (/\bexecute\(/.test(code)) {
    imports.addNamedImport('execute', '@pulsar/runtime/registry');
  }
}

/**
 * Merge user imports with generated imports
 */
export function mergeImports(userImports: Import[], generatedImports: Import[]): Import[] {
  const merged = new Map<string, Import>();

  // Add user imports first
  for (const imp of userImports) {
    merged.set(imp.source, imp);
  }

  // Merge generated imports
  for (const imp of generatedImports) {
    const existing = merged.get(imp.source);

    if (!existing) {
      merged.set(imp.source, imp);
      continue;
    }

    // Merge specifiers
    for (const spec of imp.specifiers) {
      const hasDuplicate = existing.specifiers.some(
        (s) => s.imported === spec.imported && s.local === spec.local
      );

      if (!hasDuplicate) {
        existing.specifiers.push(spec);
      }
    }

    // Merge default/namespace
    if (imp.defaultImport && !existing.defaultImport) {
      existing.defaultImport = imp.defaultImport;
    }

    if (imp.namespaceImport && !existing.namespaceImport) {
      existing.namespaceImport = imp.namespaceImport;
    }
  }

  return Array.from(merged.values());
}
