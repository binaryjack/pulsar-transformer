import { describe, expect, it } from 'vitest';
import type { IFunctionDeclarationNode, IYieldExpressionNode } from '../../ast/ast-node-types.js';
import { ASTNodeType } from '../../ast/ast-node-types.js';
import { createParser } from '../../create-parser.js';

describe('Yield Expression Parsing', () => {
  describe('basic yield', () => {
    it('should parse yield without argument', () => {
      const source = 'function* gen() { yield; }';
      const parser = createParser();
      const ast = parser.parse(source);
      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      const yieldStmt = funcDecl.body.body[0];
      const yieldExpr = yieldStmt.expression as IYieldExpressionNode;

      expect(yieldExpr.type).toBe(ASTNodeType.YIELD_EXPRESSION);
      expect(yieldExpr.argument).toBeNull();
      expect(yieldExpr.delegate).toBe(false);
    });

    it('should parse yield with identifier', () => {
      const source = 'function* gen() { yield value; }';
      const parser = createParser();
      const ast = parser.parse(source);
      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      const yieldStmt = funcDecl.body.body[0];
      const yieldExpr = yieldStmt.expression as IYieldExpressionNode;

      expect(yieldExpr.type).toBe(ASTNodeType.YIELD_EXPRESSION);
      expect(yieldExpr.argument).not.toBeNull();
      expect(yieldExpr.argument.type).toBe(ASTNodeType.IDENTIFIER);
      expect(yieldExpr.delegate).toBe(false);
    });

    it('should parse yield with literal', () => {
      const source = 'function* gen() { yield 42; }';
      const parser = createParser();
      const ast = parser.parse(source);
      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      const yieldStmt = funcDecl.body.body[0];
      const yieldExpr = yieldStmt.expression as IYieldExpressionNode;

      expect(yieldExpr.type).toBe(ASTNodeType.YIELD_EXPRESSION);
      expect(yieldExpr.argument).not.toBeNull();
      expect(yieldExpr.argument.type).toBe(ASTNodeType.LITERAL);
    });
  });

  describe('yield delegate (yield*)', () => {
    it('should parse yield* with identifier', () => {
      const source = 'function* gen() { yield* iterable; }';
      const parser = createParser();
      const ast = parser.parse(source);
      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      const yieldStmt = funcDecl.body.body[0];
      const yieldExpr = yieldStmt.expression as IYieldExpressionNode;

      expect(yieldExpr.type).toBe(ASTNodeType.YIELD_EXPRESSION);
      expect(yieldExpr.delegate).toBe(true);
      expect(yieldExpr.argument).not.toBeNull();
    });

    it('should parse yield* with array', () => {
      const source = 'function* gen() { yield* items; }';
      const parser = createParser();
      const ast = parser.parse(source);
      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      const yieldStmt = funcDecl.body.body[0];
      const yieldExpr = yieldStmt.expression as IYieldExpressionNode;

      expect(yieldExpr.delegate).toBe(true);
      expect(yieldExpr.argument.type).toBe(ASTNodeType.IDENTIFIER);
    });
  });

  describe('location tracking', () => {
    it('should track yield location', () => {
      const source = 'function* gen() { yield value; }';
      const parser = createParser();
      const ast = parser.parse(source);
      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      const yieldStmt = funcDecl.body.body[0];
      const yieldExpr = yieldStmt.expression as IYieldExpressionNode;

      expect(yieldExpr.location).toBeDefined();
      expect(yieldExpr.location.start.line).toBe(1);
    });

    it('should track yield* location', () => {
      const source = 'function* gen() { yield* items; }';
      const parser = createParser();
      const ast = parser.parse(source);
      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      const yieldStmt = funcDecl.body.body[0];
      const yieldExpr = yieldStmt.expression as IYieldExpressionNode;

      expect(yieldExpr.location).toBeDefined();
      expect(yieldExpr.location.start.line).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle yield with semicolon', () => {
      const source = 'function* gen() { yield; }';
      const parser = createParser();
      const ast = parser.parse(source);
      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      const yieldStmt = funcDecl.body.body[0];
      const yieldExpr = yieldStmt.expression as IYieldExpressionNode;

      expect(yieldExpr.argument).toBeNull();
    });

    it('should handle yield with string literal', () => {
      const source = "function* gen() { yield 'test'; }";
      const parser = createParser();
      const ast = parser.parse(source);
      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      const yieldStmt = funcDecl.body.body[0];
      const yieldExpr = yieldStmt.expression as IYieldExpressionNode;

      expect(yieldExpr.argument.type).toBe(ASTNodeType.LITERAL);
    });
  });
});
