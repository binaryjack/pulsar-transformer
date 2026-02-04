import { describe, expect, it } from 'vitest';
import type { IDecoratorNode } from '../../ast/ast-node-types.js';
import { createParser } from '../../create-parser.js';

describe('_parseDecorator', () => {
  describe('basic decorators', () => {
    it('should parse simple decorator', () => {
      const source = '@Injectable';
      const parser = createParser(source);
      const result = parser._parseDecorator() as IDecoratorNode;

      expect(result.type).toBe('Decorator');
      expect(result.expression.type).toBe('Identifier');
      expect(result.expression.name).toBe('Injectable');
    });

    it('should parse decorator with call expression', () => {
      const source = '@Component()';
      const parser = createParser(source);
      const result = parser._parseDecorator() as IDecoratorNode;

      expect(result.type).toBe('Decorator');
      expect(result.expression.type).toBe('CallExpression');
    });
  });

  describe('decorators with arguments', () => {
    it('should parse decorator with object argument', () => {
      const source = "@Component({ selector: 'app-root' })";
      const parser = createParser(source);
      const result = parser._parseDecorator() as IDecoratorNode;

      expect(result.type).toBe('Decorator');
      expect(result.expression.type).toBe('CallExpression');
    });

    it('should parse decorator with multiple arguments', () => {
      const source = "@Route('/users', { auth: true })";
      const parser = createParser(source);
      const result = parser._parseDecorator() as IDecoratorNode;

      expect(result.type).toBe('Decorator');
      expect(result.expression.type).toBe('CallExpression');
    });
  });

  describe('location tracking', () => {
    it('should track decorator location', () => {
      const source = '@Test';
      const parser = createParser(source);
      const result = parser._parseDecorator() as IDecoratorNode;

      expect(result.location).toBeDefined();
      expect(result.location.start.line).toBe(1);
    });

    it('should track decorator with call location', () => {
      const source = '@Test()';
      const parser = createParser(source);
      const result = parser._parseDecorator() as IDecoratorNode;

      expect(result.location).toBeDefined();
      expect(result.location.start.line).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle decorator with namespace', () => {
      const source = '@Component';
      const parser = createParser(source);
      const result = parser._parseDecorator() as IDecoratorNode;

      expect(result.expression.name).toBe('Component');
    });

    it('should handle decorator with empty parentheses', () => {
      const source = '@Injectable()';
      const parser = createParser(source);
      const result = parser._parseDecorator() as IDecoratorNode;

      expect(result.expression.type).toBe('CallExpression');
    });
  });
});
