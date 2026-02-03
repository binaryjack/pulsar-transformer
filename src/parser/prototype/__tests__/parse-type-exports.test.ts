import { describe, it, expect } from 'vitest';
import { createParser } from '../../create-parser.js';
import { tokenize } from '../../lexer/tokenize.js';
import { ASTNodeType } from '../../ast/ast-node-types.js';
import type { IExportDeclarationNode } from '../../ast/ast-node-types.js';

describe('Type Export Parsing', () => {
  describe('export type (full statement)', () => {
    it('should parse export type with single specifier', () => {
      const source = "export type { Foo } from './types';";
      const tokens = tokenize(source);
      const parser = createParser(tokens, source);
      const ast = parser.parse();

      expect(ast.body).toHaveLength(1);
      const exportNode = ast.body[0] as IExportDeclarationNode;
      expect(exportNode.type).toBe(ASTNodeType.EXPORT_DECLARATION);
      expect(exportNode.isTypeOnly).toBe(true);
      expect(exportNode.specifiers).toHaveLength(1);
      expect(exportNode.specifiers[0].name).toBe('Foo');
      expect(exportNode.source?.value).toBe('./types');
    });

    it('should parse export type with multiple specifiers', () => {
      const source = "export type { Foo, Bar, Baz } from './types';";
      const tokens = tokenize(source);
      const parser = createParser(tokens, source);
      const ast = parser.parse();

      const exportNode = ast.body[0] as IExportDeclarationNode;
      expect(exportNode.isTypeOnly).toBe(true);
      expect(exportNode.specifiers).toHaveLength(3);
      expect(exportNode.specifiers[0].name).toBe('Foo');
      expect(exportNode.specifiers[1].name).toBe('Bar');
      expect(exportNode.specifiers[2].name).toBe('Baz');
    });

    it('should parse export type with alias', () => {
      const source = "export type { Foo as Bar } from './types';";
      const tokens = tokenize(source);
      const parser = createParser(tokens, source);
      const ast = parser.parse();

      const exportNode = ast.body[0] as IExportDeclarationNode;
      expect(exportNode.isTypeOnly).toBe(true);
      expect(exportNode.specifiers[0].name).toBe('Foo');
      expect(exportNode.specifiers[0].alias).toBe('Bar');
    });
  });

  describe('inline type specifiers', () => {
    it('should parse single inline type export', () => {
      const source = "export { type Foo } from './module';";
      const tokens = tokenize(source);
      const parser = createParser(tokens, source);
      const ast = parser.parse();

      const exportNode = ast.body[0] as IExportDeclarationNode;
      expect(exportNode.isTypeOnly).toBe(false);
      expect(exportNode.specifiers).toHaveLength(1);
      expect(exportNode.specifiers[0].name).toBe('Foo');
      expect(exportNode.specifiers[0].isTypeOnly).toBe(true);
    });

    it('should parse mixed type and value exports', () => {
      const source = "export { type Foo, Bar, type Baz } from './module';";
      const tokens = tokenize(source);
      const parser = createParser(tokens, source);
      const ast = parser.parse();

      const exportNode = ast.body[0] as IExportDeclarationNode;
      expect(exportNode.isTypeOnly).toBe(false);
      expect(exportNode.specifiers).toHaveLength(3);
      
      expect(exportNode.specifiers[0].name).toBe('Foo');
      expect(exportNode.specifiers[0].isTypeOnly).toBe(true);
      
      expect(exportNode.specifiers[1].name).toBe('Bar');
      expect(exportNode.specifiers[1].isTypeOnly).toBeUndefined();
      
      expect(exportNode.specifiers[2].name).toBe('Baz');
      expect(exportNode.specifiers[2].isTypeOnly).toBe(true);
    });

    it('should parse inline type with alias', () => {
      const source = "export { type Foo as Bar } from './module';";
      const tokens = tokenize(source);
      const parser = createParser(tokens, source);
      const ast = parser.parse();

      const exportNode = ast.body[0] as IExportDeclarationNode;
      expect(exportNode.specifiers[0].name).toBe('Foo');
      expect(exportNode.specifiers[0].alias).toBe('Bar');
      expect(exportNode.specifiers[0].isTypeOnly).toBe(true);
    });

    it('should parse local type export (no from)', () => {
      const source = "export { type Foo };";
      const tokens = tokenize(source);
      const parser = createParser(tokens, source);
      const ast = parser.parse();

      const exportNode = ast.body[0] as IExportDeclarationNode;
      expect(exportNode.specifiers[0].name).toBe('Foo');
      expect(exportNode.specifiers[0].isTypeOnly).toBe(true);
      expect(exportNode.source).toBeNull();
    });

    it('should parse mixed local type and value exports', () => {
      const source = "export { type Foo, Bar, type Baz };";
      const tokens = tokenize(source);
      const parser = createParser(tokens, source);
      const ast = parser.parse();

      const exportNode = ast.body[0] as IExportDeclarationNode;
      expect(exportNode.specifiers).toHaveLength(3);
      expect(exportNode.specifiers[0].isTypeOnly).toBe(true);
      expect(exportNode.specifiers[1].isTypeOnly).toBeUndefined();
      expect(exportNode.specifiers[2].isTypeOnly).toBe(true);
      expect(exportNode.source).toBeNull();
    });
  });
});
