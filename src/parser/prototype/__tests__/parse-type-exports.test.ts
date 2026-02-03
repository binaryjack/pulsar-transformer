import { describe, expect, it } from 'vitest';
import type { IExportDeclarationNode } from '../../ast/index.js';
import { ASTNodeType } from '../../ast/index.js';
import { createParser } from '../../create-parser.js';

describe('Type Export Parsing', () => {
  describe('export type (full statement)', () => {
    it('should parse export type with single specifier', () => {
      const parser = createParser();
      const ast = parser.parse('export type { Foo } from "./types";');

      expect(ast.body).toHaveLength(1);
      const exportNode = ast.body[0] as IExportDeclarationNode;
      expect(exportNode.type).toBe(ASTNodeType.EXPORT_DECLARATION);
      expect(exportNode.isTypeOnly).toBe(true);
      expect(exportNode.specifiers).toHaveLength(1);
      expect(exportNode.specifiers[0].name).toBe('Foo');
      expect(exportNode.source?.value).toBe('./types');
    });

    it('should parse export type with multiple specifiers', () => {
      const parser = createParser();
      const ast = parser.parse('export type { Foo, Bar, Baz } from "./types";');

      const exportNode = ast.body[0] as IExportDeclarationNode;
      expect(exportNode.isTypeOnly).toBe(true);
      expect(exportNode.specifiers).toHaveLength(3);
      expect(exportNode.specifiers[0].name).toBe('Foo');
      expect(exportNode.specifiers[1].name).toBe('Bar');
      expect(exportNode.specifiers[2].name).toBe('Baz');
    });

    it('should parse export type with alias', () => {
      const parser = createParser();
      const ast = parser.parse('export type { Foo as Bar } from "./types";');

      const exportNode = ast.body[0] as IExportDeclarationNode;
      expect(exportNode.isTypeOnly).toBe(true);
      expect(exportNode.specifiers[0].name).toBe('Foo');
      expect(exportNode.specifiers[0].alias).toBe('Bar');
    });
  });

  describe('inline type specifiers', () => {
    it('should parse single inline type export', () => {
      const parser = createParser();
      const ast = parser.parse('export { type Foo } from "./module";');

      const exportNode = ast.body[0] as IExportDeclarationNode;
      expect(exportNode.isTypeOnly).toBe(false);
      expect(exportNode.specifiers).toHaveLength(1);
      expect(exportNode.specifiers[0].name).toBe('Foo');
      expect(exportNode.specifiers[0].isTypeOnly).toBe(true);
    });

    it('should parse mixed type and value exports', () => {
      const parser = createParser();
      const ast = parser.parse('export { type Foo, Bar, type Baz } from "./module";');

      const exportNode = ast.body[0] as IExportDeclarationNode;
      expect(exportNode.isTypeOnly).toBe(false);
      expect(exportNode.specifiers).toHaveLength(3);

      expect(exportNode.specifiers[0].name).toBe('Foo');
      expect(exportNode.specifiers[0].isTypeOnly).toBe(true);

      expect(exportNode.specifiers[1].name).toBe('Bar');
      expect(exportNode.specifiers[1].isTypeOnly).toBe(false);

      expect(exportNode.specifiers[2].name).toBe('Baz');
      expect(exportNode.specifiers[2].isTypeOnly).toBe(true);
    });

    it('should parse inline type with alias', () => {
      const parser = createParser();
      const ast = parser.parse('export { type Foo as Bar } from "./module";');

      const exportNode = ast.body[0] as IExportDeclarationNode;
      expect(exportNode.specifiers[0].name).toBe('Foo');
      expect(exportNode.specifiers[0].alias).toBe('Bar');
      expect(exportNode.specifiers[0].isTypeOnly).toBe(true);
    });

    it('should parse local type export (no from)', () => {
      const parser = createParser();
      const ast = parser.parse('export { type Foo };');

      const exportNode = ast.body[0] as IExportDeclarationNode;
      expect(exportNode.specifiers[0].name).toBe('Foo');
      expect(exportNode.specifiers[0].isTypeOnly).toBe(true);
      expect(exportNode.source).toBeNull();
    });

    it('should parse mixed local type and value exports', () => {
      const parser = createParser();
      const ast = parser.parse('export { type Foo, Bar, type Baz };');

      const exportNode = ast.body[0] as IExportDeclarationNode;
      expect(exportNode.specifiers).toHaveLength(3);
      expect(exportNode.specifiers[0].isTypeOnly).toBe(true);
      expect(exportNode.specifiers[1].isTypeOnly).toBe(false);
      expect(exportNode.specifiers[2].isTypeOnly).toBe(true);
      expect(exportNode.source).toBeNull();
    });
  });
});
