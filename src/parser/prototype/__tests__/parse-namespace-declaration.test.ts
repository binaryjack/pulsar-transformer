import { describe, expect, it } from 'vitest';
import type { INamespaceDeclarationNode } from '../../ast-node-types';
import { createParser } from '../../create-parser';

describe('_parseNamespaceDeclaration', () => {
  describe('basic namespace declarations', () => {
    it('should parse empty namespace', () => {
      const source = 'namespace Utils {}';
      const parser = createParser(source);
      const result = parser._parseNamespaceDeclaration() as INamespaceDeclarationNode;

      expect(result.type).toBe('NAMESPACE_DECLARATION');
      expect(result.name.name).toBe('Utils');
      expect(result.body).toHaveLength(0);
    });

    it('should parse namespace with function', () => {
      const source =
        'namespace Math { function add(a: number, b: number): number { return a + b; } }';
      const parser = createParser(source);
      const result = parser._parseNamespaceDeclaration() as INamespaceDeclarationNode;

      expect(result.body).toHaveLength(1);
      expect(result.body[0].type).toBe('FUNCTION_DECLARATION');
    });

    it('should parse namespace with multiple declarations', () => {
      const source = `namespace App {
        function foo() {}
        function bar() {}
        interface User {}
      }`;
      const parser = createParser(source);
      const result = parser._parseNamespaceDeclaration() as INamespaceDeclarationNode;

      expect(result.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('module keyword', () => {
    it('should parse module declaration', () => {
      const source = 'module Utils {}';
      const parser = createParser(source);
      const result = parser._parseNamespaceDeclaration() as INamespaceDeclarationNode;

      expect(result.type).toBe('NAMESPACE_DECLARATION');
      expect(result.name.name).toBe('Utils');
    });
  });

  describe('nested namespaces', () => {
    it('should parse nested namespace', () => {
      const source = 'namespace Outer { namespace Inner { function test() {} } }';
      const parser = createParser(source);
      const result = parser._parseNamespaceDeclaration() as INamespaceDeclarationNode;

      expect(result.name.name).toBe('Outer');
      expect(result.body).toHaveLength(1);
      expect(result.body[0].type).toBe('NAMESPACE_DECLARATION');
    });
  });

  describe('namespace with interfaces', () => {
    it('should parse namespace with interface', () => {
      const source = 'namespace Models { interface User { id: number; } }';
      const parser = createParser(source);
      const result = parser._parseNamespaceDeclaration() as INamespaceDeclarationNode;

      expect(result.body).toHaveLength(1);
      expect(result.body[0].type).toBe('INTERFACE_DECLARATION');
    });
  });

  describe('namespace with classes', () => {
    it('should parse namespace with class', () => {
      const source = 'namespace Services { class UserService { getName() { return "test"; } } }';
      const parser = createParser(source);
      const result = parser._parseNamespaceDeclaration() as INamespaceDeclarationNode;

      expect(result.body).toHaveLength(1);
      expect(result.body[0].type).toBe('CLASS_DECLARATION');
    });
  });

  describe('namespace with enums', () => {
    it('should parse namespace with enum', () => {
      const source = 'namespace Constants { enum Color { Red, Blue } }';
      const parser = createParser(source);
      const result = parser._parseNamespaceDeclaration() as INamespaceDeclarationNode;

      expect(result.body).toHaveLength(1);
      expect(result.body[0].type).toBe('ENUM_DECLARATION');
    });
  });

  describe('location tracking', () => {
    it('should track namespace location', () => {
      const source = 'namespace Test { function foo() {} }';
      const parser = createParser(source);
      const result = parser._parseNamespaceDeclaration() as INamespaceDeclarationNode;

      expect(result.loc).toBeDefined();
      expect(result.loc?.start.line).toBe(1);
      expect(result.loc?.start.column).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty namespace', () => {
      const source = 'namespace Empty {}';
      const parser = createParser(source);
      const result = parser._parseNamespaceDeclaration() as INamespaceDeclarationNode;

      expect(result.body).toHaveLength(0);
    });

    it('should skip type aliases inside namespace', () => {
      const source = 'namespace Types { type UserID = string; function test() {} }';
      const parser = createParser(source);
      const result = parser._parseNamespaceDeclaration() as INamespaceDeclarationNode;

      // Should have at least the function
      expect(result.body.length).toBeGreaterThanOrEqual(1);
    });
  });
});
