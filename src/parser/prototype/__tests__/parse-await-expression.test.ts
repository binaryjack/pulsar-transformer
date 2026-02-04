import { describe, expect, it } from 'vitest';
import type { IAwaitExpressionNode } from '../../ast/ast-node-types.js';
import { createParser } from '../../create-parser.js';

describe('_parseAwaitExpression', () => {
  describe('basic await', () => {
    it('should parse await with identifier', () => {
      const source = 'await promise';
      const parser = createParser(source);
      const result = parser._parseAwaitExpression() as IAwaitExpressionNode;

      expect(result.type).toBe('AwaitExpression');
      expect(result.argument).not.toBeNull();
      expect(result.argument.type).toBe('Identifier');
      expect(result.argument.name).toBe('promise');
    });

    it('should parse await with call expression', () => {
      const source = 'await fetch()';
      const parser = createParser(source);
      const result = parser._parseAwaitExpression() as IAwaitExpressionNode;

      expect(result.type).toBe('AwaitExpression');
      expect(result.argument).not.toBeNull();
      expect(result.argument.type).toBe('CallExpression');
    });

    it('should parse await with string literal', () => {
      const source = "await '/api/data'";
      const parser = createParser(source);
      const result = parser._parseAwaitExpression() as IAwaitExpressionNode;

      expect(result.argument.type).toBe('Literal');
    });
  });

  describe('location tracking', () => {
    it('should track await location', () => {
      const source = 'await promise';
      const parser = createParser(source);
      const result = parser._parseAwaitExpression() as IAwaitExpressionNode;

      expect(result.location).toBeDefined();
      expect(result.location.start.line).toBe(1);
    });

    it('should track await with call location', () => {
      const source = 'await getData()';
      const parser = createParser(source);
      const result = parser._parseAwaitExpression() as IAwaitExpressionNode;

      expect(result.location).toBeDefined();
      expect(result.location.start.line).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle await with complex call', () => {
      const source = "await fetch('/api/users')";
      const parser = createParser(source);
      const result = parser._parseAwaitExpression() as IAwaitExpressionNode;

      expect(result.argument.type).toBe('CallExpression');
    });

    it('should handle await with number literal', () => {
      const source = 'await 42';
      const parser = createParser(source);
      const result = parser._parseAwaitExpression() as IAwaitExpressionNode;

      expect(result.argument.type).toBe('Literal');
    });
  });
});
