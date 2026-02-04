/**
 * Tests for function declaration parsing
 */

import { describe, expect, it } from 'vitest';
import type { IFunctionDeclarationNode, IProgramNode } from '../ast/index.js';
import { createParser } from '../create-parser.js';

describe('parseFunctionDeclaration', () => {
  describe('basic function declarations', () => {
    it('should parse simple function with no parameters', () => {
      const parser = createParser();
      const ast = parser.parse('function greet() { }') as IProgramNode;

      expect(ast.type).toBe('Program');
      expect(ast.body).toHaveLength(1);

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.type).toBe('FunctionDeclaration');
      expect(funcDecl.name.name).toBe('greet');
      expect(funcDecl.params).toEqual([]);
      expect(funcDecl.async).toBeUndefined();
      expect(funcDecl.generator).toBeUndefined();
      expect(funcDecl.returnType).toBeUndefined();
    });

    it('should parse function with single parameter', () => {
      const parser = createParser();
      const ast = parser.parse('function greet(name) { }') as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.params).toHaveLength(1);
      expect(funcDecl.params[0].name.name).toBe('name');
      expect(funcDecl.params[0].typeAnnotation).toBeUndefined();
    });

    it('should parse function with multiple parameters', () => {
      const parser = createParser();
      const ast = parser.parse('function add(a, b, c) { }') as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.params).toHaveLength(3);
      expect(funcDecl.params[0].name.name).toBe('a');
      expect(funcDecl.params[1].name.name).toBe('b');
      expect(funcDecl.params[2].name.name).toBe('c');
    });

    it('should parse function with body containing statements', () => {
      const parser = createParser();
      const ast = parser.parse(`
        function calculate() {
          const x = 10;
          return x;
        }
      `) as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.body.type).toBe('BlockStatement');
      expect(funcDecl.body.body).toHaveLength(2);
    });
  });

  describe('typed parameters', () => {
    it('should parse parameter with simple type annotation', () => {
      const parser = createParser();
      const ast = parser.parse('function greet(name: string) { }') as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.params[0].typeAnnotation?.typeString).toBe('string');
    });

    it('should parse multiple parameters with type annotations', () => {
      const parser = createParser();
      const ast = parser.parse('function add(a: number, b: number) { }') as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.params[0].typeAnnotation?.typeString).toBe('number');
      expect(funcDecl.params[1].typeAnnotation?.typeString).toBe('number');
    });

    it('should parse parameter with complex type annotation', () => {
      const parser = createParser();
      const ast = parser.parse(
        'function process(data: { name: string; age: number }) { }'
      ) as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.params[0].typeAnnotation?.typeString).toBe(
        '{ name : string ; age : number }'
      );
    });

    it('should parse parameter with union type annotation', () => {
      const parser = createParser();
      const ast = parser.parse('function handle(value: string | number) { }') as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.params[0].typeAnnotation?.typeString).toBe('string | number');
    });

    it('should parse parameter with array type annotation', () => {
      const parser = createParser();
      const ast = parser.parse('function sum(numbers: number[]) { }') as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.params[0].typeAnnotation?.typeString).toBe('number [ ]');
    });

    it('should parse mixed typed and untyped parameters', () => {
      const parser = createParser();
      const ast = parser.parse('function mix(a: string, b, c: number) { }') as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.params[0].typeAnnotation?.typeString).toBe('string');
      expect(funcDecl.params[1].typeAnnotation).toBeUndefined();
      expect(funcDecl.params[2].typeAnnotation?.typeString).toBe('number');
    });
  });

  describe('return type annotations', () => {
    it('should parse function with simple return type', () => {
      const parser = createParser();
      const ast = parser.parse('function getName(): string { }') as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.returnType?.typeString).toBe('string');
    });

    it('should parse function with complex return type', () => {
      const parser = createParser();
      const ast = parser.parse(
        'function getUser(): { name: string; age: number } { }'
      ) as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.returnType?.typeString).toBe('{ name : string ; age : number }');
    });

    it('should parse function with union return type', () => {
      const parser = createParser();
      const ast = parser.parse('function getValue(): string | null { }') as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.returnType?.typeString).toBe('string | null');
    });

    it('should parse function with array return type', () => {
      const parser = createParser();
      const ast = parser.parse('function getNames(): string[] { }') as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.returnType?.typeString).toBe('string [ ]');
    });

    it('should parse function with void return type', () => {
      const parser = createParser();
      const ast = parser.parse('function log(message: string): void { }') as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.returnType?.typeString).toBe('void');
    });
  });

  describe('async functions', () => {
    it('should parse async function', () => {
      const parser = createParser();
      const ast = parser.parse('async function fetchData() { }') as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.async).toBe(true);
      expect(funcDecl.generator).toBeUndefined();
    });

    it('should parse async function with parameters', () => {
      const parser = createParser();
      const ast = parser.parse(
        'async function fetchUser(id: number): Promise<User> { }'
      ) as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.async).toBe(true);
      expect(funcDecl.params[0].typeAnnotation?.typeString).toBe('number');
      expect(funcDecl.returnType?.typeString).toBe('Promise < User >');
    });

    it('should parse async function with body', () => {
      const parser = createParser();
      const ast = parser.parse(`
        async function loadData() {
          const data = await fetch('/api/data');
          return data;
        }
      `) as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.async).toBe(true);
      // Body should have 2 statements: const declaration and return
      expect(funcDecl.body.body.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('generator functions', () => {
    it('should parse generator function', () => {
      const parser = createParser();
      const ast = parser.parse('function* generate() { }') as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.generator).toBe(true);
      expect(funcDecl.async).toBeUndefined();
    });

    it('should parse generator function with parameters', () => {
      const parser = createParser();
      const ast = parser.parse('function* counter(start: number, end: number) { }') as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.generator).toBe(true);
      expect(funcDecl.params).toHaveLength(2);
    });

    it('should parse generator function with return type', () => {
      const parser = createParser();
      const ast = parser.parse('function* numbers(): Generator<number> { }') as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.generator).toBe(true);
      expect(funcDecl.returnType?.typeString).toBe('Generator < number >');
    });
  });

  describe('complete examples', () => {
    it('should parse fully typed function', () => {
      const parser = createParser();
      const ast = parser.parse(`
        function calculateTotal(items: Item[], tax: number): number {
          const subtotal = items.reduce((sum, item) => sum + item.price, 0);
          return subtotal * (1 + tax);
        }
      `) as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.name.name).toBe('calculateTotal');
      expect(funcDecl.params).toHaveLength(2);
      expect(funcDecl.params[0].typeAnnotation?.typeString).toBe('Item [ ]');
      expect(funcDecl.params[1].typeAnnotation?.typeString).toBe('number');
      expect(funcDecl.returnType?.typeString).toBe('number');
      expect(funcDecl.body.body).toHaveLength(2);
    });

    it('should parse async function with complex types', () => {
      const parser = createParser();
      const ast = parser.parse(`
        async function fetchUserData(id: string): Promise<{ name: string; email: string }> {
          const response = await fetch('/api/users/' + id);
          return response.json();
        }
      `) as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.async).toBe(true);
      expect(funcDecl.params[0].typeAnnotation?.typeString).toBe('string');
      expect(funcDecl.returnType?.typeString).toBe(
        'Promise < { name : string ; email : string } >'
      );
    });
  });

  describe('edge cases', () => {
    it('should parse function with empty body', () => {
      const parser = createParser();
      const ast = parser.parse('function empty() { }') as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.body.body).toHaveLength(0);
    });

    it('should handle function with complex nested types', () => {
      const parser = createParser();
      const ast = parser.parse(
        'function complex(data: { users: Array<{ id: number; name: string }> }): void { }'
      ) as IProgramNode;

      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      expect(funcDecl.params[0].typeAnnotation?.typeString).toBe(
        '{ users : Array < { id : number ; name : string } > }'
      );
    });
  });
});
