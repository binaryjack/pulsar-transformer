import { describe, expect, it } from 'vitest';
import type { ITryStatementNode } from '../../ast-node-types';
import { ASTNodeType } from '../../ast/ast-node-types';
import { createParser } from '../../create-parser';

describe('_parseTryStatement', () => {
  describe('basic try-catch', () => {
    it('should parse try-catch block', () => {
      const source = 'try { doSomething(); } catch (error) { handleError(); }';
      const parser = createParser(source);
      const result = parser._parseTryStatement() as ITryStatementNode;

      expect(result.type).toBe(ASTNodeType.TRY_STATEMENT);
      expect(result.block.type).toBe(ASTNodeType.BLOCK_STATEMENT);
      expect(result.handler).not.toBeNull();
      expect(result.finalizer).toBeNull();
    });

    it('should parse catch with parameter', () => {
      const source = 'try { test(); } catch (e) { log(e); }';
      const parser = createParser(source);
      const result = parser._parseTryStatement() as ITryStatementNode;

      expect(result.handler?.param?.name).toBe('e');
    });
  });

  describe('try-finally', () => {
    it('should parse try-finally without catch', () => {
      const source = 'try { doWork(); } finally { cleanup(); }';
      const parser = createParser(source);
      const result = parser._parseTryStatement() as ITryStatementNode;

      expect(result.handler).toBeNull();
      expect(result.finalizer).not.toBeNull();
      expect(result.finalizer?.type).toBe(ASTNodeType.BLOCK_STATEMENT);
    });
  });

  describe('try-catch-finally', () => {
    it('should parse complete try-catch-finally', () => {
      const source = 'try { work(); } catch (err) { handle(); } finally { cleanup(); }';
      const parser = createParser(source);
      const result = parser._parseTryStatement() as ITryStatementNode;

      expect(result.handler).not.toBeNull();
      expect(result.finalizer).not.toBeNull();
    });
  });

  describe('modern TypeScript - optional catch parameter', () => {
    it('should parse catch without parameter', () => {
      const source = 'try { test(); } catch { fallback(); }';
      const parser = createParser(source);
      const result = parser._parseTryStatement() as ITryStatementNode;

      expect(result.handler).not.toBeNull();
      expect(result.handler?.param).toBeNull();
    });
  });

  describe('nested try blocks', () => {
    it('should parse nested try-catch', () => {
      const source = `try {
        try { inner(); } catch (e) { handleInner(); }
      } catch (outer) { handleOuter(); }`;
      const parser = createParser(source);
      const result = parser._parseTryStatement() as ITryStatementNode;

      expect(result.type).toBe(ASTNodeType.TRY_STATEMENT);
      expect(result.handler).not.toBeNull();
    });
  });

  describe('location tracking', () => {
    it('should track try statement location', () => {
      const source = 'try { test(); } catch (e) { handle(); }';
      const parser = createParser(source);
      const result = parser._parseTryStatement() as ITryStatementNode;

      expect(result.location).toBeDefined();
      expect(result.location.start.line).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should parse empty try block', () => {
      const source = 'try {} catch (e) {}';
      const parser = createParser(source);
      const result = parser._parseTryStatement() as ITryStatementNode;

      expect(result.block.type).toBe(ASTNodeType.BLOCK_STATEMENT);
    });

    it('should parse empty catch block', () => {
      const source = 'try { test(); } catch (e) {}';
      const parser = createParser(source);
      const result = parser._parseTryStatement() as ITryStatementNode;

      expect(result.handler?.body.type).toBe(ASTNodeType.BLOCK_STATEMENT);
    });

    it('should parse empty finally block', () => {
      const source = 'try { test(); } finally {}';
      const parser = createParser(source);
      const result = parser._parseTryStatement() as ITryStatementNode;

      expect(result.finalizer?.type).toBe(ASTNodeType.BLOCK_STATEMENT);
    });
  });
});
