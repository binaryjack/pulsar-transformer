/**
 * Parser factory function
 *
 * Creates a Parser instance for parsing PSR source code.
 */

import { Parser } from './parser.js';
import type { IParser, IParserConfig } from './parser.types.js';
import './prototype/index.js'; // Ensure prototype methods are attached

/**
 * Create a Parser instance
 *
 * @param config - Parser configuration OR source string for unit tests
 * @returns Parser instance
 *
 * @example
 * // Production use:
 * const parser = createParser();
 * const ast = parser.parse('component MyButton() { return <button>Click</button>; }');
 *
 * // Unit test use (initializes lexer for testing private methods):
 * const parser = createParser('for (let i = 0; i < 10; i++) {}');
 * const result = parser._parseForStatement();
 */
export function createParser(config?: IParserConfig | string): IParser {
  const parser = new Parser(typeof config === 'string' ? {} : config || {}) as unknown as IParser &
    Record<string, any>;

  // If a source string was passed, initialize lexer for unit testing
  if (typeof config === 'string') {
    const source = config;
    parser._source = source;
    parser._current = 0;
    parser._errors = [];

    // Tokenize source using instance lexer
    parser._tokens = parser._lexer.tokenize(source);
  }

  return parser as IParser;
}
