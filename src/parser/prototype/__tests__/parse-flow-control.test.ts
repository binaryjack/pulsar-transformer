import { describe, expect, it } from 'vitest';
import type {
  IBreakStatementNode,
  IContinueStatementNode,
  IThrowStatementNode,
} from '../../ast-node-types';
import { createParser } from '../../create-parser';

describe('Flow Control Parsers', () => {
  describe('_parseThrowStatement', () => {
    it('should parse throw with new Error', () => {
      const source = 'throw new Error("Failed");';
      const parser = createParser(source);
      const result = parser._parseThrowStatement() as IThrowStatementNode;

      expect(result.type).toBe('THROW_STATEMENT');
      expect(result.argument).not.toBeNull();
    });

    it('should parse throw with string', () => {
      const source = 'throw "Error message";';
      const parser = createParser(source);
      const result = parser._parseThrowStatement() as IThrowStatementNode;

      expect(result.argument).not.toBeNull();
      expect(result.argument.type).toBe('STRING_LITERAL');
    });

    it('should parse throw with variable', () => {
      const source = 'throw error;';
      const parser = createParser(source);
      const result = parser._parseThrowStatement() as IThrowStatementNode;

      expect(result.argument).not.toBeNull();
      expect(result.argument.type).toBe('IDENTIFIER');
    });
  });

  describe('_parseBreakStatement', () => {
    it('should parse break without label', () => {
      const source = 'break;';
      const parser = createParser(source);
      const result = parser._parseBreakStatement() as IBreakStatementNode;

      expect(result.type).toBe('BREAK_STATEMENT');
      expect(result.label).toBeNull();
    });

    it('should parse break with label', () => {
      const source = 'break outerLoop;';
      const parser = createParser(source);
      const result = parser._parseBreakStatement() as IBreakStatementNode;

      expect(result.label).not.toBeNull();
      expect(result.label?.type).toBe('IDENTIFIER');
      expect(result.label?.name).toBe('outerLoop');
    });
  });

  describe('_parseContinueStatement', () => {
    it('should parse continue without label', () => {
      const source = 'continue;';
      const parser = createParser(source);
      const result = parser._parseContinueStatement() as IContinueStatementNode;

      expect(result.type).toBe('CONTINUE_STATEMENT');
      expect(result.label).toBeNull();
    });

    it('should parse continue with label', () => {
      const source = 'continue loopLabel;';
      const parser = createParser(source);
      const result = parser._parseContinueStatement() as IContinueStatementNode;

      expect(result.label).not.toBeNull();
      expect(result.label?.type).toBe('IDENTIFIER');
      expect(result.label?.name).toBe('loopLabel');
    });
  });

  describe('location tracking', () => {
    it('should track throw statement location', () => {
      const source = 'throw new Error();';
      const parser = createParser(source);
      const result = parser._parseThrowStatement() as IThrowStatementNode;

      expect(result.loc).toBeDefined();
      expect(result.loc?.start.line).toBe(1);
    });

    it('should track break statement location', () => {
      const source = 'break;';
      const parser = createParser(source);
      const result = parser._parseBreakStatement() as IBreakStatementNode;

      expect(result.loc).toBeDefined();
      expect(result.loc?.start.line).toBe(1);
    });

    it('should track continue statement location', () => {
      const source = 'continue;';
      const parser = createParser(source);
      const result = parser._parseContinueStatement() as IContinueStatementNode;

      expect(result.loc).toBeDefined();
      expect(result.loc?.start.line).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle break in switch', () => {
      const source = 'switch (x) { case 1: break; }';
      const parser = createParser(source);
      const switchNode = parser._parseSwitchStatement();

      expect(switchNode.type).toBe('SWITCH_STATEMENT');
    });

    it('should handle continue in loop', () => {
      const source = 'while (true) { if (skip) continue; work(); }';
      const parser = createParser(source);
      const loopNode = parser._parseWhileStatement();

      expect(loopNode.type).toBe('WHILE_STATEMENT');
    });

    it('should handle labeled statements', () => {
      const source = 'outer: while (true) { inner: while (true) { break outer; } }';
      const parser = createParser(source);
      const result = parser._parseWhileStatement();

      expect(result.type).toBe('WHILE_STATEMENT');
    });
  });
});
