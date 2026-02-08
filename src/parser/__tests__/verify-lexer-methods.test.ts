/**
 * Simple test to verify lexer instance creation
 */

import { describe, expect, it } from 'vitest';
import { createLexer } from '../lexer/index.js';

describe('Lexer Instance Check', () => {
  it('should create lexer with enterTypeContext method', () => {
    const lexer = createLexer();

    expect(lexer).toBeDefined();
    expect(typeof lexer.enterTypeContext).toBe('function');
    expect(typeof lexer.exitTypeContext).toBe('function');
    expect(typeof lexer.isInTypeContext).toBe('function');
  });

  it('should call enterTypeContext without error', () => {
    const lexer = createLexer();

    expect(() => {
      lexer.enterTypeContext();
      lexer.exitTypeContext();
    }).not.toThrow();
  });
});
