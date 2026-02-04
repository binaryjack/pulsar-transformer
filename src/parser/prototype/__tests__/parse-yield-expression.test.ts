import { describe, expect, it } from 'vitest';
import type { IYieldExpressionNode } from '../../ast/ast-node-types.js';
import { createParser } from '../../create-parser.js';

describe('_parseYieldExpression', () => {
  describe('basic yield', () => {
    it('should parse yield without argument', () => {
      const source = 'yield';
      const parser = createParser(source);
      const result = parser._parseYieldExpression() as IYieldExpressionNode;

      expect(result.type).toBe('YieldExpression');
      expect(result.argument).toBeNull();
      expect(result.delegate).toBe(false);
    });

    it('should parse yield with identifier', () => {
      const source = 'yield value';
      const parser = createParser(source);
      const result = parser._parseYieldExpression() as IYieldExpressionNode;

      expect(result.type).toBe('YieldExpression');
      expect(result.argument).not.toBeNull();
      expect(result.argument.type).toBe('Identifier');
      expect(result.delegate).toBe(false);
    });

    it('should parse yield with literal', () => {
      const source = 'yield 42';
      const parser = createParser(source);
      const result = parser._parseYieldExpression() as IYieldExpressionNode;

      expect(result.type).toBe('YieldExpression');
      expect(result.argument).not.toBeNull();
      expect(result.argument.type).toBe('Literal');
    });
  });

  describe('yield delegate (yield*)', () => {
    it('should parse yield* with identifier', () => {
      const source = 'yield* iterable';
      const parser = createParser(source);
      const result = parser._parseYieldExpression() as IYieldExpressionNode;

      expect(result.type).toBe('YieldExpression');
      expect(result.delegate).toBe(true);
      expect(result.argument).not.toBeNull();
    });

    it('should parse yield* with array', () => {
      const source = 'yield* items';
      const parser = createParser(source);
      const result = parser._parseYieldExpression() as IYieldExpressionNode;

      expect(result.delegate).toBe(true);
      expect(result.argument.type).toBe('Identifier');
    });
  });

  describe('location tracking', () => {
    it('should track yield location', () => {
      const source = 'yield value';
      const parser = createParser(source);
      const result = parser._parseYieldExpression() as IYieldExpressionNode;

      expect(result.location).toBeDefined();
      expect(result.location.start.line).toBe(1);
    });

    it('should track yield* location', () => {
      const source = 'yield* items';
      const parser = createParser(source);
      const result = parser._parseYieldExpression() as IYieldExpressionNode;

      expect(result.location).toBeDefined();
      expect(result.location.start.line).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle yield with semicolon', () => {
      const source = 'yield;';
      const parser = createParser(source);
      const result = parser._parseYieldExpression() as IYieldExpressionNode;

      expect(result.argument).toBeNull();
    });

    it('should handle yield with string literal', () => {
      const source = "yield 'test'";
      const parser = createParser(source);
      const result = parser._parseYieldExpression() as IYieldExpressionNode;

      expect(result.argument.type).toBe('Literal');
    });
  });
});
