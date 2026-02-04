import { describe, expect, it } from 'vitest';
import type { IAwaitExpressionNode, IFunctionDeclarationNode } from '../../ast/ast-node-types.js';
import { createParser } from '../../create-parser.js';

describe('Await Expression Parsing', () => {
  describe('basic await', () => {
    it('should parse await with identifier', () => {
      const source = 'async function test() { await promise; }';
      const parser = createParser();
      const ast = parser.parse(source);
      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      const awaitStmt = funcDecl.body.body[0];
      const awaitExpr = awaitStmt.expression as IAwaitExpressionNode;

      expect(awaitExpr.type).toBe('AwaitExpression');
      expect(awaitExpr.argument).not.toBeNull();
      expect(awaitExpr.argument.type).toBe('Identifier');
      expect(awaitExpr.argument.name).toBe('promise');
    });

    it('should parse await with call expression', () => {
      const source = 'async function test() { await fetch(); }';
      const parser = createParser();
      const ast = parser.parse(source);
      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      const awaitStmt = funcDecl.body.body[0];
      const awaitExpr = awaitStmt.expression as IAwaitExpressionNode;

      expect(awaitExpr.type).toBe('AwaitExpression');
      expect(awaitExpr.argument).not.toBeNull();
      expect(awaitExpr.argument.type).toBe('CallExpression');
    });

    it('should parse await with string literal', () => {
      const source = "async function test() { await '/api/data'; }";
      const parser = createParser();
      const ast = parser.parse(source);
      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      const awaitStmt = funcDecl.body.body[0];
      const awaitExpr = awaitStmt.expression as IAwaitExpressionNode;

      expect(awaitExpr.argument.type).toBe('Literal');
    });
  });

  describe('location tracking', () => {
    it('should track await location', () => {
      const source = 'async function test() { await promise; }';
      const parser = createParser();
      const ast = parser.parse(source);
      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      const awaitStmt = funcDecl.body.body[0];
      const awaitExpr = awaitStmt.expression as IAwaitExpressionNode;

      expect(awaitExpr.location).toBeDefined();
      expect(awaitExpr.location.start.line).toBe(1);
    });

    it('should track await with call location', () => {
      const source = 'async function test() { await getData(); }';
      const parser = createParser();
      const ast = parser.parse(source);
      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      const awaitStmt = funcDecl.body.body[0];
      const awaitExpr = awaitStmt.expression as IAwaitExpressionNode;

      expect(awaitExpr.location).toBeDefined();
      expect(awaitExpr.location.start.line).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle await with complex call', () => {
      const source = "async function test() { await fetch('/api/users'); }";
      const parser = createParser();
      const ast = parser.parse(source);
      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      const awaitStmt = funcDecl.body.body[0];
      const awaitExpr = awaitStmt.expression as IAwaitExpressionNode;

      expect(awaitExpr.argument.type).toBe('CallExpression');
    });

    it('should handle await with number literal', () => {
      const source = 'async function test() { await 42; }';
      const parser = createParser();
      const ast = parser.parse(source);
      const funcDecl = ast.body[0] as IFunctionDeclarationNode;
      const awaitStmt = funcDecl.body.body[0];
      const awaitExpr = awaitStmt.expression as IAwaitExpressionNode;

      expect(awaitExpr.argument.type).toBe('Literal');
    });
  });
});

