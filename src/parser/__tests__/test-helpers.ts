/**
 * Test helpers for parser unit tests
 *
 * Provides utilities for testing individual parser methods in isolation
 */

import { createParser } from '../create-parser.js';
import type { IParser } from '../parser.types.js';

/**
 * Creates a parser instance initialized with source code for testing private methods
 *
 * This helper properly initializes the parser's internal lexer state so that
 * private parsing methods can be called directly in unit tests.
 *
 * @param source - Source code string to parse
 * @returns Parser instance with initialized lexer positioned at first token
 *
 * @example
 * const parser = createTestParser('for (let i = 0; i < 10; i++) {}');
 * const result = parser._parseForStatement();
 */
export function createTestParser(source: string): IParser & Record<string, any> {
  const parser = createParser() as any;

  // Initialize internal state exactly like parse() does
  parser._source = source;
  parser._current = 0;
  parser._errors = [];

  // Tokenize source using instance lexer
  parser._tokens = parser._lexer.tokenize(source);

  return parser as IParser & Record<string, any>;
}
