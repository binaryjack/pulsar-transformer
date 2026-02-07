/**
 * Import Manager Tests
 *
 * Tests for import management functionality.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { createImportManager, getRuntimeImportPath } from '../src/analyzer/import-manager.js';

describe('Import Manager', () => {
  let manager: ReturnType<typeof createImportManager>;

  beforeEach(() => {
    manager = createImportManager();
  });

  describe('addNamedImport()', () => {
    it('should add named import', () => {
      manager.addNamedImport('useState', 'react');
      expect(manager.hasImport('useState', 'react')).toBe(true);
    });

    it('should add named import with alias', () => {
      const localName = manager.addNamedImport('useState', 'react', 'useStateHook');
      expect(localName).toBe('useStateHook');
      expect(manager.getLocalName('useState', 'react')).toBe('useStateHook');
    });

    it('should not duplicate imports', () => {
      manager.addNamedImport('useState', 'react');
      manager.addNamedImport('useState', 'react');

      const imports = manager.getImports();
      expect(imports).toHaveLength(1);
      expect(imports[0].specifiers).toHaveLength(1);
    });

    it('should add multiple named imports from same source', () => {
      manager.addNamedImport('useState', 'react');
      manager.addNamedImport('useEffect', 'react');

      const imports = manager.getImports();
      expect(imports).toHaveLength(1);
      expect(imports[0].specifiers).toHaveLength(2);
    });
  });

  describe('addDefaultImport()', () => {
    it('should add default import', () => {
      manager.addDefaultImport('React', 'react');

      const imports = manager.getImports();
      expect(imports).toHaveLength(1);
      expect(imports[0].defaultImport).toBe('React');
    });

    it('should not duplicate default imports', () => {
      manager.addDefaultImport('React', 'react');
      manager.addDefaultImport('React', 'react');

      const imports = manager.getImports();
      expect(imports).toHaveLength(1);
      expect(imports[0].defaultImport).toBe('React');
    });
  });

  describe('addNamespaceImport()', () => {
    it('should add namespace import', () => {
      manager.addNamespaceImport('React', 'react');

      const imports = manager.getImports();
      expect(imports).toHaveLength(1);
      expect(imports[0].namespaceImport).toBe('React');
    });
  });

  describe('addTypeImport()', () => {
    it('should add type-only import', () => {
      manager.addTypeImport('Props', './types');

      const imports = manager.getImports();
      expect(imports).toHaveLength(1);
      expect(imports[0].specifiers[0].isTypeOnly).toBe(true);
    });

    it('should add type import with alias', () => {
      const localName = manager.addTypeImport('Props', './types', 'MyProps');
      expect(localName).toBe('MyProps');
    });
  });

  describe('addSideEffectImport()', () => {
    it('should add side-effect import', () => {
      manager.addSideEffectImport('./styles.css');

      const imports = manager.getImports();
      expect(imports).toHaveLength(1);
      expect(imports[0].isSideEffect).toBe(true);
    });
  });

  describe('addDynamicImport()', () => {
    it('should add dynamic import', () => {
      const dynamicImport = manager.addDynamicImport('./module');

      expect(dynamicImport.id).toMatch(/^__dynamic_import_\d+$/);
      expect(dynamicImport.source).toBe('./module');
      expect(dynamicImport.isLazy).toBe(true);
    });

    it('should add dynamic import with specifiers', () => {
      const dynamicImport = manager.addDynamicImport('./module', ['foo', 'bar']);

      expect(dynamicImport.specifiers).toEqual(['foo', 'bar']);
    });
  });

  describe('generateImportStatements()', () => {
    it('should generate simple named import', () => {
      manager.addNamedImport('useState', 'react');

      const statements = manager.generateImportStatements();
      expect(statements).toEqual(["import { useState } from 'react';"]);
    });

    it('should generate named import with alias', () => {
      manager.addNamedImport('useState', 'react', 'useStateHook');

      const statements = manager.generateImportStatements();
      expect(statements).toEqual(["import { useState as useStateHook } from 'react';"]);
    });

    it('should generate default import', () => {
      manager.addDefaultImport('React', 'react');

      const statements = manager.generateImportStatements();
      expect(statements).toEqual(["import React from 'react';"]);
    });

    it('should generate namespace import', () => {
      manager.addNamespaceImport('React', 'react');

      const statements = manager.generateImportStatements();
      expect(statements).toEqual(["import * as React from 'react';"]);
    });

    it('should generate combined imports', () => {
      manager.addDefaultImport('React', 'react');
      manager.addNamedImport('useState', 'react');
      manager.addNamedImport('useEffect', 'react');

      const statements = manager.generateImportStatements();
      expect(statements).toEqual(["import React, { useState, useEffect } from 'react';"]);
    });

    it('should generate side-effect import', () => {
      manager.addSideEffectImport('./styles.css');

      const statements = manager.generateImportStatements();
      expect(statements).toEqual(["import './styles.css';"]);
    });

    it('should generate type-only import', () => {
      manager.addTypeImport('Props', './types');

      const statements = manager.generateImportStatements();
      expect(statements).toEqual(["import { type Props } from './types';"]);
    });

    it('should sort imports with side-effects first', () => {
      manager.addNamedImport('foo', 'zzz-module');
      manager.addSideEffectImport('./aaa-styles.css');
      manager.addNamedImport('bar', 'aaa-module');

      const statements = manager.generateImportStatements();
      expect(statements[0]).toBe("import './aaa-styles.css';");
    });
  });

  describe('generateDynamicImportHelpers()', () => {
    it('should generate dynamic import without specifiers', () => {
      manager.addDynamicImport('./module');

      const helpers = manager.generateDynamicImportHelpers();
      expect(helpers).toHaveLength(1);
      expect(helpers[0]).toContain("import('./module')");
    });

    it('should generate dynamic import with specifiers', () => {
      manager.addDynamicImport('./module', ['foo', 'bar']);

      const helpers = manager.generateDynamicImportHelpers();
      expect(helpers).toHaveLength(1);
      expect(helpers[0]).toContain('await import');
      expect(helpers[0]).toContain('foo, bar');
    });
  });

  describe('deduplicateImports()', () => {
    it('should deduplicate same imports', () => {
      manager.addNamedImport('useState', 'react');
      manager.addNamedImport('useState', 'react');

      manager.deduplicateImports();

      const imports = manager.getImports();
      expect(imports).toHaveLength(1);
      expect(imports[0].specifiers).toHaveLength(1);
    });

    it('should merge imports from same source', () => {
      manager.addNamedImport('useState', 'react');
      manager.addNamedImport('useEffect', 'react');

      manager.deduplicateImports();

      const imports = manager.getImports();
      expect(imports).toHaveLength(1);
      expect(imports[0].specifiers).toHaveLength(2);
    });
  });

  describe('getRuntimeImportPath()', () => {
    it('should get runtime path for createSignal', () => {
      expect(getRuntimeImportPath('createSignal')).toBe('@pulsar/runtime');
    });

    it('should get runtime path for jsx', () => {
      expect(getRuntimeImportPath('jsx')).toBe('@pulsar/runtime/jsx-runtime');
    });

    it('should get runtime path for template', () => {
      expect(getRuntimeImportPath('template')).toBe('@pulsar/runtime/dom');
    });

    it('should return undefined for unknown runtime', () => {
      expect(getRuntimeImportPath('unknownFunction')).toBeUndefined();
    });
  });

  describe('clear()', () => {
    it('should clear all imports', () => {
      manager.addNamedImport('useState', 'react');
      manager.addDefaultImport('React', 'react');
      manager.addDynamicImport('./module');

      manager.clear();

      expect(manager.getImports()).toHaveLength(0);
      expect(manager.getDynamicImports()).toHaveLength(0);
    });
  });
});
