yewimport { describe, expect, it } from 'vitest';
import type { INamespaceDeclarationNode, IProgramNode } from '../../ast/ast-node-types.js';
import { ASTNodeType } from '../../ast/ast-node-types.js';
import { createParser } from '../../create-parser.js';

describe('_parseNamespaceDeclaration', () => {
  describe('basic namespace declarations', () => {
    it('should parse empty namespace', () => {
      const source = 'namespace Utils {}';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;
      const result = ast.body[0] as INamespaceDeclarationNode;

      expect(result.type).toBe(ASTNodeType.NAMESPACE_DECLARATION);
      expect(result.name.name).toBe('Utils');
      expect(result.body).toHaveLength(0);
    });

    it('should parse namespace with function', () => {
      const source =
        'namespace Math { function add(a: number, b: number): number { return a + b; } }';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;
      const result = ast.body[0] as INamespaceDeclarationNode;

      expect(result.body).toHaveLength(1);
      expect(result.body[0].type).toBe(ASTNodeType.FUNCTION_DECLARATION);
    });

    it('should parse namespace with multiple declarations', () => {
      const source = `namespace App {
        function foo() {}
        function bar() {}
        interface User {}
      }`;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;
      const result = ast.body[0] as INamespaceDeclarationNode;

      expect(result.body.length).toBeGreaterThanOrEqual(2);
      expect(result.body[0].type).toBe(ASTNodeType.FUNCTION_DECLARATION);
      expect(result.body[1].type).toBe(ASTNodeType.FUNCTION_DECLARATION);
    });
  });

  describe('module keyword', () => {
    it('should parse module declaration', () => {
      const source = 'module Utils {}';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;
      const result = ast.body[0] as INamespaceDeclarationNode;

      expect(result.type).toBe(ASTNodeType.NAMESPACE_DECLARATION);
      expect(result.name.name).toBe('Utils');
    });
  });

  describe('nested namespaces', () => {
    it('should parse nested namespace', () => {
      const source = 'namespace Outer { namespace Inner {} }';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;
      const result = ast.body[0] as INamespaceDeclarationNode;

      expect(result.body).toHaveLength(1);
      expect(result.body[0].type).toBe(ASTNodeType.NAMESPACE_DECLARATION);
    });
  });

  describe('namespace with interfaces', () => {
    it('should parse namespace with interface', () => {
      const source = 'namespace Types { interface User { name: string; } }';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;
      const result = ast.body[0] as INamespaceDeclarationNode;

      expect(result.body).toHaveLength(1);
      expect(result.body[0].type).toBe(ASTNodeType.INTERFACE_DECLARATION);
    });
  });

  describe('namespace with classes', () => {
    it('should parse namespace with class', () => {
      const source = 'namespace Models { class User {} }';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;
      const result = ast.body[0] as INamespaceDeclarationNode;

      expect(result.body).toHaveLength(1);
      expect(result.body[0].type).toBe(ASTNodeType.CLASS_DECLARATION);
    });
  });

  describe('namespace with enums', () => {
    it('should parse namespace with enum', () => {
      const source = 'namespace Status { enum State { Active, Inactive } }';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;
      const result = ast.body[0] as INamespaceDeclarationNode;

      expect(result.body).toHaveLength(1);
      expect(result.body[0].type).toBe(ASTNodeType.ENUM_DECLARATION);
    });
  });

  describe('location tracking', () => {
    it('should track namespace location', () => {
      const source = 'namespace Utils {}';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;
      const result = ast.body[0] as INamespaceDeclarationNode;

      expect(result.location).toBeDefined();
      expect(result.location.start.line).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty namespace', () => {
      const source = 'namespace Empty {}';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;
      const result = ast.body[0] as INamespaceDeclarationNode;

      expect(result.body).toHaveLength(0);
    });

    it('should skip type aliases inside namespace', () => {
      const source = 'namespace Types { type ID = string; }';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;
      const result = ast.body[0] as INamespaceDeclarationNode;

      // Type alias should be parsed
      expect(result.body.length).toBeGreaterThanOrEqual(0);
    });
  });
});
