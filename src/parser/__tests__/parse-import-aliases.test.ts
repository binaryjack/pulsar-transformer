/**
 * Tests for import alias parsing
 *
 * Validates that import aliases are correctly parsed.
 */

import { describe, expect, it } from 'vitest';
import type { IImportDeclarationNode, IProgramNode } from '../ast/index.js';
import { createParser } from '../create-parser.js';

describe('parseImportDeclaration - Aliases', () => {
  describe('named import aliases', () => {
    it('should parse single named import with alias', () => {
      const parser = createParser();
      const source = `import { foo as bar } from './module';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers).toHaveLength(1);
      expect(importDecl.specifiers[0].name).toBe('foo');
      expect(importDecl.specifiers[0].alias).toBe('bar');
      expect(importDecl.source.value).toBe('./module');
    });

    it('should parse multiple named imports with aliases', () => {
      const parser = createParser();
      const source = `import { foo as bar, baz as qux } from './module';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers).toHaveLength(2);

      expect(importDecl.specifiers[0].name).toBe('foo');
      expect(importDecl.specifiers[0].alias).toBe('bar');

      expect(importDecl.specifiers[1].name).toBe('baz');
      expect(importDecl.specifiers[1].alias).toBe('qux');
    });

    it('should parse mixed imports with and without aliases', () => {
      const parser = createParser();
      const source = `import { foo, bar as baz, qux } from './module';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers).toHaveLength(3);

      expect(importDecl.specifiers[0].name).toBe('foo');
      expect(importDecl.specifiers[0].alias).toBeUndefined();

      expect(importDecl.specifiers[1].name).toBe('bar');
      expect(importDecl.specifiers[1].alias).toBe('baz');

      expect(importDecl.specifiers[2].name).toBe('qux');
      expect(importDecl.specifiers[2].alias).toBeUndefined();
    });

    it('should parse import alias from npm package', () => {
      const parser = createParser();
      const source = `import { createElement as h } from 'react';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers).toHaveLength(1);
      expect(importDecl.specifiers[0].name).toBe('createElement');
      expect(importDecl.specifiers[0].alias).toBe('h');
      expect(importDecl.source.value).toBe('react');
    });

    it('should handle trailing comma with aliases', () => {
      const parser = createParser();
      const source = `import { foo as bar, baz as qux, } from './module';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers).toHaveLength(2);
      expect(importDecl.specifiers[0].alias).toBe('bar');
      expect(importDecl.specifiers[1].alias).toBe('qux');
    });
  });

  describe('no aliases', () => {
    it('should have undefined alias for normal imports', () => {
      const parser = createParser();
      const source = `import { foo } from './module';`;
      const ast = parser.parse(source) as IProgramNode;

      const importDecl = ast.body[0] as IImportDeclarationNode;
      expect(importDecl.specifiers[0].alias).toBeUndefined();
    });
  });
});
