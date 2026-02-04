import { describe, expect, it } from 'vitest';
import type { IClassDeclarationNode, IDecoratorNode } from '../../ast/ast-node-types.js';
import { createParser } from '../../create-parser.js';

describe('Decorator Parsing', () => {
  describe('basic decorators', () => {
    it('should parse simple decorator on class', () => {
      const source = '@Injectable\nclass Service {}';
      const parser = createParser();
      const ast = parser.parse(source);
      const classDecl = ast.body[0] as IClassDeclarationNode;

      expect(classDecl.decorators).toBeDefined();
      expect(classDecl.decorators).toHaveLength(1);
      const decorator = classDecl.decorators![0] as IDecoratorNode;
      expect(decorator.type).toBe('Decorator');
      expect(decorator.expression.type).toBe('Identifier');
      expect(decorator.expression.name).toBe('Injectable');
    });

    it('should parse decorator with call expression', () => {
      const source = '@Component()\nclass App {}';
      const parser = createParser();
      const ast = parser.parse(source);
      const classDecl = ast.body[0] as IClassDeclarationNode;
      const decorator = classDecl.decorators![0] as IDecoratorNode;

      expect(decorator.type).toBe('Decorator');
      expect(decorator.expression.type).toBe('CallExpression');
    });
  });

  describe('decorators with arguments', () => {
    it('should parse decorator with object argument', () => {
      const source = "@Component({ selector: 'app-root' })\nclass App {}";
      const parser = createParser();
      const ast = parser.parse(source);
      const classDecl = ast.body[0] as IClassDeclarationNode;
      const decorator = classDecl.decorators![0] as IDecoratorNode;

      expect(decorator.type).toBe('Decorator');
      expect(decorator.expression.type).toBe('CallExpression');
    });

    it('should parse decorator with multiple arguments', () => {
      const source = "@Route('/users', { auth: true })\nclass UserController {}";
      const parser = createParser();
      const ast = parser.parse(source);
      const classDecl = ast.body[0] as IClassDeclarationNode;
      const decorator = classDecl.decorators![0] as IDecoratorNode;

      expect(decorator.type).toBe('Decorator');
      expect(decorator.expression.type).toBe('CallExpression');
    });
  });

  describe('location tracking', () => {
    it('should track decorator location', () => {
      const source = '@Test\nclass TestClass {}';
      const parser = createParser();
      const ast = parser.parse(source);
      const classDecl = ast.body[0] as IClassDeclarationNode;
      const decorator = classDecl.decorators![0] as IDecoratorNode;

      expect(decorator.location).toBeDefined();
      expect(decorator.location.start.line).toBe(1);
    });

    it('should track decorator with call location', () => {
      const source = '@Test()\nclass TestClass {}';
      const parser = createParser();
      const ast = parser.parse(source);
      const classDecl = ast.body[0] as IClassDeclarationNode;
      const decorator = classDecl.decorators![0] as IDecoratorNode;

      expect(decorator.location).toBeDefined();
      expect(decorator.location.start.line).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle decorator with namespace', () => {
      const source = '@Component\nclass App {}';
      const parser = createParser();
      const ast = parser.parse(source);
      const classDecl = ast.body[0] as IClassDeclarationNode;
      const decorator = classDecl.decorators![0] as IDecoratorNode;

      expect(decorator.expression.name).toBe('Component');
    });

    it('should handle decorator with empty parentheses', () => {
      const source = '@Injectable()\nclass Service {}';
      const parser = createParser();
      const ast = parser.parse(source);
      const classDecl = ast.body[0] as IClassDeclarationNode;
      const decorator = classDecl.decorators![0] as IDecoratorNode;

      expect(decorator.expression.type).toBe('CallExpression');
    });
  });
});

