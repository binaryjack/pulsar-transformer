import { describe, expect, it } from 'vitest';
import { createTestParser } from '../../__tests__/test-helpers';
import type {
  IDoWhileStatementNode,
  IForStatementNode,
  IWhileStatementNode,
} from '../../ast-node-types';
import { ASTNodeType } from '../../ast/ast-node-types.js';

describe('Loop Statement Parsers', () => {
  describe('_parseForStatement', () => {
    it('should parse basic for loop', () => {
      const source = 'for (let i = 0; i < 10; i++) { console.log(i); }';
      const parser = createTestParser(source);
      const result = parser._parseForStatement() as IForStatementNode;

      expect(result.type).toBe(ASTNodeType.FOR_STATEMENT);
      expect(result.init).not.toBeNull();
      expect(result.test).not.toBeNull();
      expect(result.update).not.toBeNull();
      expect(result.body.type).toBe(ASTNodeType.BLOCK_STATEMENT);
    });

    it('should parse for loop without init', () => {
      const source = 'for (; i < 10; i++) { work(); }';
      const parser = createTestParser(source);
      const result = parser._parseForStatement() as IForStatementNode;

      expect(result.init).toBeNull();
      expect(result.test).not.toBeNull();
      expect(result.update).not.toBeNull();
    });

    it('should parse for loop without test', () => {
      const source = 'for (let i = 0; ; i++) { if (done) break; }';
      const parser = createTestParser(source);
      const result = parser._parseForStatement() as IForStatementNode;

      expect(result.init).not.toBeNull();
      expect(result.test).toBeNull();
      expect(result.update).not.toBeNull();
    });

    it('should parse for loop without update', () => {
      const source = 'for (let i = 0; i < 10; ) { i++; }';
      const parser = createTestParser(source);
      const result = parser._parseForStatement() as IForStatementNode;

      expect(result.init).not.toBeNull();
      expect(result.test).not.toBeNull();
      expect(result.update).toBeNull();
    });

    it('should parse infinite for loop', () => {
      const source = 'for (;;) { if (done) break; }';
      const parser = createTestParser(source);
      const result = parser._parseForStatement() as IForStatementNode;

      expect(result.init).toBeNull();
      expect(result.test).toBeNull();
      expect(result.update).toBeNull();
    });
  });

  describe('_parseWhileStatement', () => {
    it('should parse basic while loop', () => {
      const source = 'while (x < 10) { x++; }';
      const parser = createTestParser(source);
      const result = parser._parseWhileStatement() as IWhileStatementNode;

      expect(result.type).toBe(ASTNodeType.WHILE_STATEMENT);
      expect(result.test).not.toBeNull();
      expect(result.body.type).toBe(ASTNodeType.BLOCK_STATEMENT);
    });

    it('should parse while with complex condition', () => {
      const source = 'while (x < 10 && y > 0) { work(); }';
      const parser = createTestParser(source);
      const result = parser._parseWhileStatement() as IWhileStatementNode;

      expect(result.test).not.toBeNull();
    });

    it('should parse nested while loops', () => {
      const source = 'while (outer) { while (inner) { work(); } }';
      const parser = createTestParser(source);
      const result = parser._parseWhileStatement() as IWhileStatementNode;

      expect(result.type).toBe(ASTNodeType.WHILE_STATEMENT);
      expect(result.body.type).toBe(ASTNodeType.BLOCK_STATEMENT);
    });
  });

  describe('_parseDoWhileStatement', () => {
    it('should parse basic do-while loop', () => {
      const source = 'do { x++; } while (x < 10);';
      const parser = createTestParser(source);
      const result = parser._parseDoWhileStatement() as IDoWhileStatementNode;

      expect(result.type).toBe(ASTNodeType.DO_WHILE_STATEMENT);
      expect(result.body.type).toBe(ASTNodeType.BLOCK_STATEMENT);
      expect(result.test).not.toBeNull();
    });

    it('should parse do-while with complex condition', () => {
      const source = 'do { process(); } while (hasMore() && !stopped);';
      const parser = createTestParser(source);
      const result = parser._parseDoWhileStatement() as IDoWhileStatementNode;

      expect(result.test).not.toBeNull();
    });
  });

  describe('loop location tracking', () => {
    it('should track for loop location', () => {
      const source = 'for (let i = 0; i < 10; i++) { work(); }';
      const parser = createTestParser(source);
      const result = parser._parseForStatement() as IForStatementNode;

      expect(result.location).toBeDefined();
      expect(result.location.start.line).toBe(1);
    });

    it('should track while loop location', () => {
      const source = 'while (true) { work(); }';
      const parser = createTestParser(source);
      const result = parser._parseWhileStatement() as IWhileStatementNode;

      expect(result.location).toBeDefined();
      expect(result.location.start.line).toBe(1);
    });

    it('should track do-while loop location', () => {
      const source = 'do { work(); } while (true);';
      const parser = createTestParser(source);
      const result = parser._parseDoWhileStatement() as IDoWhileStatementNode;

      expect(result.location).toBeDefined();
      expect(result.location.start.line).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should parse for loop with empty body', () => {
      const source = 'for (let i = 0; i < 10; i++) {}';
      const parser = createTestParser(source);
      const result = parser._parseForStatement() as IForStatementNode;

      expect(result.body.type).toBe(ASTNodeType.BLOCK_STATEMENT);
    });

    it('should parse while loop with empty body', () => {
      const source = 'while (processing) {}';
      const parser = createTestParser(source);
      const result = parser._parseWhileStatement() as IWhileStatementNode;

      expect(result.body.type).toBe(ASTNodeType.BLOCK_STATEMENT);
    });

    it('should parse do-while with empty body', () => {
      const source = 'do {} while (true);';
      const parser = createTestParser(source);
      const result = parser._parseDoWhileStatement() as IDoWhileStatementNode;

      expect(result.body.type).toBe(ASTNodeType.BLOCK_STATEMENT);
    });
  });
});
