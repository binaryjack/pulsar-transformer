import { describe, expect, it } from 'vitest';
import type { IEnumDeclarationNode, IProgramNode } from '../../ast/ast-node-types.js';
import { ASTNodeType } from '../../ast/ast-node-types.js';
import { createParser } from '../../create-parser.js';

describe('_parseEnumDeclaration', () => {
  describe('basic enum declarations', () => {
    it('should parse empty enum', () => {
      const source = 'enum Empty {}';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;
      const result = ast.body[0] as IEnumDeclarationNode;

      expect(result.type).toBe(ASTNodeType.ENUM_DECLARATION);
      expect(result.name.name).toBe('Empty');
      expect(result.isConst).toBe(false);
      expect(result.members).toHaveLength(0);
    });

    it('should parse enum with single member', () => {
      const source = 'enum Color { Red }';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;
      const result = ast.body[0] as IEnumDeclarationNode;

      expect(result.type).toBe(ASTNodeType.ENUM_DECLARATION);
      expect(result.name.name).toBe('Color');
      expect(result.members).toHaveLength(1);
      expect(result.members[0].name.name).toBe('Red');
      expect(result.members[0].initializer).toBeUndefined();
    });

    it('should parse enum with multiple members', () => {
      const source = 'enum Status { Pending, Active, Complete }';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;
      const result = ast.body[0] as IEnumDeclarationNode;

      expect(result.members).toHaveLength(3);
      expect(result.members[0].name.name).toBe('Pending');
      expect(result.members[1].name.name).toBe('Active');
      expect(result.members[2].name.name).toBe('Complete');
    });
  });

  describe('const enums', () => {
    it('should parse const enum', () => {
      const source = 'const enum Direction { Up, Down, Left, Right }';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;
      const result = ast.body[0] as IEnumDeclarationNode;

      expect(result.isConst).toBe(true);
      expect(result.name.name).toBe('Direction');
      expect(result.members).toHaveLength(4);
    });
  });

  describe('enum members with initializers', () => {
    it('should parse numeric initializers', () => {
      const source = 'enum HttpStatus { OK = 200, NotFound = 404, ServerError = 500 }';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;
      const result = ast.body[0] as IEnumDeclarationNode;

      expect(result.members).toHaveLength(3);
      expect(result.members[0].initializer?.type).toBe('Literal');
      expect(result.members[1].initializer?.type).toBe('Literal');
      expect(result.members[2].initializer?.type).toBe('Literal');
    });

    it('should parse string initializers', () => {
      const source = `enum Color { Red = 'RED', Blue = 'BLUE' }`;
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;
      const result = ast.body[0] as IEnumDeclarationNode;

      expect(result.members).toHaveLength(2);
      expect(result.members[0].initializer?.type).toBe('Literal');
      expect(result.members[1].initializer?.type).toBe('Literal');
    });

    it('should parse mixed initialized and uninitialized members', () => {
      const source = 'enum Mixed { A, B = 10, C, D = 20 }';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;
      const result = ast.body[0] as IEnumDeclarationNode;

      expect(result.members).toHaveLength(4);
      expect(result.members[0].initializer).toBeUndefined();
      expect(result.members[1].initializer).toBeDefined();
      expect(result.members[2].initializer).toBeUndefined();
      expect(result.members[3].initializer).toBeDefined();
    });
  });

  describe('location tracking', () => {
    it('should track enum declaration location', () => {
      const source = 'enum Test { A }';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;
      const result = ast.body[0] as IEnumDeclarationNode;

      expect(result.location).toBeDefined();
      expect(result.location.start.line).toBe(1);
    });

    it('should track member locations', () => {
      const source = 'enum Test { A, B, C }';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;
      const result = ast.body[0] as IEnumDeclarationNode;

      result.members.forEach((member) => {
        expect(member.location).toBeDefined();
        expect(member.location.start.line).toBe(1);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle trailing comma', () => {
      const source = 'enum Test { A, B, }';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;
      const result = ast.body[0] as IEnumDeclarationNode;

      expect(result.members).toHaveLength(2);
    });

    it('should parse computed member names', () => {
      const source = 'enum Test { A = 1 + 1, B = A * 2 }';
      const parser = createParser();
      const ast = parser.parse(source) as IProgramNode;
      const result = ast.body[0] as IEnumDeclarationNode;

      expect(result.members).toHaveLength(2);
      expect(result.members[0].initializer).toBeDefined();
      expect(result.members[1].initializer).toBeDefined();
    });
  });
});
