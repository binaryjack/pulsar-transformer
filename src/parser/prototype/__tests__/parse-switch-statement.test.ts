import { describe, expect, it } from 'vitest';
import type { ISwitchStatementNode } from '../../ast-node-types';
import { createParser } from '../../create-parser';

describe('_parseSwitchStatement', () => {
  describe('basic switch statements', () => {
    it('should parse switch with single case', () => {
      const source = 'switch (x) { case 1: break; }';
      const parser = createParser(source);
      const result = parser._parseSwitchStatement() as ISwitchStatementNode;

      expect(result.type).toBe('SWITCH_STATEMENT');
      expect(result.cases).toHaveLength(1);
      expect(result.cases[0].test).not.toBeNull();
    });

    it('should parse switch with multiple cases', () => {
      const source =
        'switch (status) { case "active": doActive(); break; case "inactive": doInactive(); break; }';
      const parser = createParser(source);
      const result = parser._parseSwitchStatement() as ISwitchStatementNode;

      expect(result.cases).toHaveLength(2);
    });

    it('should parse switch with default case', () => {
      const source = 'switch (x) { case 1: break; default: handleDefault(); }';
      const parser = createParser(source);
      const result = parser._parseSwitchStatement() as ISwitchStatementNode;

      expect(result.cases).toHaveLength(2);
      const defaultCase = result.cases.find((c) => c.test === null);
      expect(defaultCase).toBeDefined();
    });
  });

  describe('fall-through cases', () => {
    it('should parse fall-through without break', () => {
      const source = 'switch (x) { case 1: case 2: case 3: doMultiple(); break; }';
      const parser = createParser(source);
      const result = parser._parseSwitchStatement() as ISwitchStatementNode;

      expect(result.cases).toHaveLength(3);
    });
  });

  describe('case statements', () => {
    it('should parse case with multiple statements', () => {
      const source = 'switch (x) { case 1: a(); b(); c(); break; }';
      const parser = createParser(source);
      const result = parser._parseSwitchStatement() as ISwitchStatementNode;

      expect(result.cases[0].consequent.length).toBeGreaterThanOrEqual(1);
    });

    it('should parse case with no statements', () => {
      const source = 'switch (x) { case 1: }';
      const parser = createParser(source);
      const result = parser._parseSwitchStatement() as ISwitchStatementNode;

      expect(result.cases[0].consequent).toHaveLength(0);
    });
  });

  describe('default case', () => {
    it('should parse default at beginning', () => {
      const source = 'switch (x) { default: handleDefault(); break; case 1: break; }';
      const parser = createParser(source);
      const result = parser._parseSwitchStatement() as ISwitchStatementNode;

      expect(result.cases[0].test).toBeNull();
    });

    it('should parse default in middle', () => {
      const source = 'switch (x) { case 1: break; default: handleDefault(); case 2: break; }';
      const parser = createParser(source);
      const result = parser._parseSwitchStatement() as ISwitchStatementNode;

      const defaultCase = result.cases.find((c) => c.test === null);
      expect(defaultCase).toBeDefined();
    });
  });

  describe('location tracking', () => {
    it('should track switch statement location', () => {
      const source = 'switch (x) { case 1: break; }';
      const parser = createParser(source);
      const result = parser._parseSwitchStatement() as ISwitchStatementNode;

      expect(result.loc).toBeDefined();
      expect(result.loc?.start.line).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should parse empty switch', () => {
      const source = 'switch (x) {}';
      const parser = createParser(source);
      const result = parser._parseSwitchStatement() as ISwitchStatementNode;

      expect(result.cases).toHaveLength(0);
    });

    it('should parse switch with only default', () => {
      const source = 'switch (x) { default: doDefault(); }';
      const parser = createParser(source);
      const result = parser._parseSwitchStatement() as ISwitchStatementNode;

      expect(result.cases).toHaveLength(1);
      expect(result.cases[0].test).toBeNull();
    });

    it('should parse nested switch', () => {
      const source = 'switch (x) { case 1: switch (y) { case 2: break; } break; }';
      const parser = createParser(source);
      const result = parser._parseSwitchStatement() as ISwitchStatementNode;

      expect(result.type).toBe('SWITCH_STATEMENT');
    });
  });
});
