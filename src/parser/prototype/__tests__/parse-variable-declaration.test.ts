/**
 * Tests for Variable Declaration Parsing
 *
 * Validates parsing of const/let declarations with various patterns.
 */

import { describe, expect, it } from 'vitest';
import { ASTNodeType } from '../../ast/ast-node-types.js';
import { createParser } from '../../create-parser.js';

describe('parseVariableDeclaration', () => {
  describe('Basic Declarations', () => {
    it('should parse const with number literal', () => {
      const source = 'const count = 42;';
      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.type).toBe(ASTNodeType.PROGRAM);
      expect(ast.body).toHaveLength(1);

      const varDecl = ast.body[0];
      expect(varDecl.type).toBe(ASTNodeType.VARIABLE_DECLARATION);
      expect(varDecl.kind).toBe('const');
      expect(varDecl.declarations).toHaveLength(1);
      expect(varDecl.declarations[0].id.type).toBe(ASTNodeType.IDENTIFIER);
      expect(varDecl.declarations[0].id.name).toBe('count');
    });

    it('should parse let with string literal', () => {
      const source = 'let message = "hello";';
      const parser = createParser();
      const ast = parser.parse(source);

      const varDecl = ast.body[0];
      expect(varDecl.type).toBe(ASTNodeType.VARIABLE_DECLARATION);
      expect(varDecl.kind).toBe('let');
      expect(varDecl.declarations[0].id.name).toBe('message');
    });

    it('should parse const without initializer', () => {
      const source = 'const value;';
      const parser = createParser();
      const ast = parser.parse(source);

      const varDecl = ast.body[0];
      expect(varDecl.declarations[0].init).toBeNull();
    });
  });

  describe('Array Destructuring', () => {
    it('should parse array destructuring with two elements', () => {
      const source = 'const [count, setCount] = createSignal(0);';
      const parser = createParser();
      const ast = parser.parse(source);

      const varDecl = ast.body[0];
      expect(varDecl.type).toBe(ASTNodeType.VARIABLE_DECLARATION);
      expect(varDecl.kind).toBe('const');
      expect(varDecl.declarations[0].id.type).toBe('ArrayPattern');
      expect(varDecl.declarations[0].id.elements).toHaveLength(2);
      expect(varDecl.declarations[0].id.elements[0].name).toBe('count');
      expect(varDecl.declarations[0].id.elements[1].name).toBe('setCount');
    });

    it('should parse array destructuring with three elements', () => {
      const source = 'const [a, b, c] = getData();';
      const parser = createParser();
      const ast = parser.parse(source);

      const varDecl = ast.body[0];
      expect(varDecl.declarations[0].id.elements).toHaveLength(3);
      expect(varDecl.declarations[0].id.elements[0].name).toBe('a');
      expect(varDecl.declarations[0].id.elements[1].name).toBe('b');
      expect(varDecl.declarations[0].id.elements[2].name).toBe('c');
    });

    it('should parse let with array destructuring', () => {
      const source = 'let [x, y] = coords;';
      const parser = createParser();
      const ast = parser.parse(source);

      const varDecl = ast.body[0];
      expect(varDecl.kind).toBe('let');
      expect(varDecl.declarations[0].id.type).toBe('ArrayPattern');
    });
  });

  describe('Call Expression Initializers', () => {
    it('should parse const with function call', () => {
      const source = 'const signal = createSignal(0);';
      const parser = createParser();
      const ast = parser.parse(source);

      const varDecl = ast.body[0];
      expect(varDecl.declarations[0].init.type).toBe(ASTNodeType.CALL_EXPRESSION);
      expect(varDecl.declarations[0].init.callee.name).toBe('createSignal');
    });

    it('should parse const with nested function calls', () => {
      const source = 'const result = processData(fetchData());';
      const parser = createParser();
      const ast = parser.parse(source);

      const varDecl = ast.body[0];
      expect(varDecl.declarations[0].init.type).toBe(ASTNodeType.CALL_EXPRESSION);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing semicolon', () => {
      const source = 'const x = 1';
      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.body[0].type).toBe(ASTNodeType.VARIABLE_DECLARATION);
    });

    it('should handle multiple spaces', () => {
      const source = 'const    count    =    42   ;';
      const parser = createParser();
      const ast = parser.parse(source);

      const varDecl = ast.body[0];
      expect(varDecl.declarations[0].id.name).toBe('count');
    });

    it('should parse single element array destructuring', () => {
      const source = 'const [value] = array;';
      const parser = createParser();
      const ast = parser.parse(source);

      const varDecl = ast.body[0];
      expect(varDecl.declarations[0].id.elements).toHaveLength(1);
    });
  });

  describe('Multiple Declarations in Program', () => {
    it('should parse multiple const declarations', () => {
      const source = `
        const a = 1;
        const b = 2;
        const c = 3;
      `;
      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.body).toHaveLength(3);
      expect(ast.body[0].declarations[0].id.name).toBe('a');
      expect(ast.body[1].declarations[0].id.name).toBe('b');
      expect(ast.body[2].declarations[0].id.name).toBe('c');
    });

    it('should parse mixed const and let', () => {
      const source = `
        const x = 10;
        let y = 20;
      `;
      const parser = createParser();
      const ast = parser.parse(source);

      expect(ast.body).toHaveLength(2);
      expect(ast.body[0].kind).toBe('const');
      expect(ast.body[1].kind).toBe('let');
    });
  });

  describe('Type Annotations', () => {
    it('should parse const with number type annotation', () => {
      const source = 'const count: number = 42;';
      const parser = createParser();
      const ast = parser.parse(source);

      const varDecl = ast.body[0];
      expect(varDecl.declarations[0].typeAnnotation).toBeDefined();
      expect(varDecl.declarations[0].typeAnnotation.type).toBe(ASTNodeType.TYPE_ANNOTATION);
      expect(varDecl.declarations[0].typeAnnotation.typeString).toBe('number');
    });

    it('should parse const with string type annotation', () => {
      const source = 'const message: string = "hello";';
      const parser = createParser();
      const ast = parser.parse(source);

      const varDecl = ast.body[0];
      expect(varDecl.declarations[0].typeAnnotation.typeString).toBe('string');
    });

    it('should parse const with complex type annotation', () => {
      const source = 'const callback: (value: string) => void = fn;';
      const parser = createParser();
      const ast = parser.parse(source);

      const varDecl = ast.body[0];
      expect(varDecl.declarations[0].typeAnnotation).toBeDefined();
      expect(varDecl.declarations[0].typeAnnotation.typeString).toContain('(');
      expect(varDecl.declarations[0].typeAnnotation.typeString).toContain(')');
    });

    it('should parse let with array type annotation', () => {
      const source = 'let items: string[] = [];';
      const parser = createParser();
      const ast = parser.parse(source);

      const varDecl = ast.body[0];
      expect(varDecl.declarations[0].typeAnnotation.typeString).toBe('string [ ]');
    });

    it('should parse const without type annotation', () => {
      const source = 'const value = 42;';
      const parser = createParser();
      const ast = parser.parse(source);

      const varDecl = ast.body[0];
      expect(varDecl.declarations[0].typeAnnotation).toBeNull();
    });

    it('should parse const with generic type annotation', () => {
      const source = 'const data: Array<number> = [];';
      const parser = createParser();
      const ast = parser.parse(source);

      const varDecl = ast.body[0];
      expect(varDecl.declarations[0].typeAnnotation.typeString).toContain('Array');
      expect(varDecl.declarations[0].typeAnnotation.typeString).toContain('<');
      expect(varDecl.declarations[0].typeAnnotation.typeString).toContain('>');
    });
  });
});
