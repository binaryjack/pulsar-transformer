/**
 * Tests for type import parsing
 */

import { ASTNodeType } from '../../ast/index.js';
import { createParser } from '../../create-parser.js';

describe('Type Import Parsing', () => {
  describe('import type (full statement)', () => {
    it('should parse import type with single specifier', () => {
      const parser = createParser();
      const ast = parser.parse('import type { Foo } from "./types";');

      expect(ast.body).toHaveLength(1);
      const importNode = ast.body[0];

      expect(importNode.type).toBe(ASTNodeType.IMPORT_DECLARATION);
      expect(importNode.isTypeOnly).toBe(true);
      expect(importNode.specifiers).toHaveLength(1);
      expect(importNode.specifiers[0].name).toBe('Foo');
    });

    it('should parse import type with multiple specifiers', () => {
      const parser = createParser();
      const ast = parser.parse('import type { Foo, Bar, Baz } from "./types";');

      const importNode = ast.body[0];
      expect(importNode.isTypeOnly).toBe(true);
      expect(importNode.specifiers).toHaveLength(3);
      expect(importNode.specifiers[0].name).toBe('Foo');
      expect(importNode.specifiers[1].name).toBe('Bar');
      expect(importNode.specifiers[2].name).toBe('Baz');
    });

    it('should parse import type with alias', () => {
      const parser = createParser();
      const ast = parser.parse('import type { Foo as Bar } from "./types";');

      const importNode = ast.body[0];
      expect(importNode.isTypeOnly).toBe(true);
      expect(importNode.specifiers).toHaveLength(1);
      expect(importNode.specifiers[0].name).toBe('Foo');
      expect(importNode.specifiers[0].alias).toBe('Bar');
    });
  });

  describe('inline type specifiers', () => {
    it('should parse single inline type import', () => {
      const parser = createParser();
      const ast = parser.parse('import { type Foo } from "./module";');

      const importNode = ast.body[0];
      expect(importNode.isTypeOnly).toBe(false); // Statement is not type-only
      expect(importNode.specifiers).toHaveLength(1);
      expect(importNode.specifiers[0].name).toBe('Foo');
      expect(importNode.specifiers[0].isTypeOnly).toBe(true); // Specifier is type-only
    });

    it('should parse mixed type and value imports', () => {
      const parser = createParser();
      const ast = parser.parse('import { type Foo, Bar, type Baz } from "./module";');

      const importNode = ast.body[0];
      expect(importNode.isTypeOnly).toBe(false);
      expect(importNode.specifiers).toHaveLength(3);

      expect(importNode.specifiers[0].name).toBe('Foo');
      expect(importNode.specifiers[0].isTypeOnly).toBe(true);

      expect(importNode.specifiers[1].name).toBe('Bar');
      expect(importNode.specifiers[1].isTypeOnly).toBeFalsy();

      expect(importNode.specifiers[2].name).toBe('Baz');
      expect(importNode.specifiers[2].isTypeOnly).toBe(true);
    });

    it('should parse inline type with alias', () => {
      const parser = createParser();
      const ast = parser.parse('import { type Foo as Bar } from "./module";');

      const importNode = ast.body[0];
      expect(importNode.specifiers).toHaveLength(1);
      expect(importNode.specifiers[0].name).toBe('Foo');
      expect(importNode.specifiers[0].alias).toBe('Bar');
      expect(importNode.specifiers[0].isTypeOnly).toBe(true);
    });
  });
});
