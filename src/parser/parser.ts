/**
 * PSR Parser Constructor
 *
 * Prototype-based parser for PSR syntax.
 * Converts tokens into Abstract Syntax Tree (AST).
 */

import { createLexer } from './lexer/index.js';
import type { IParserConfig, IParserInternal } from './parser.types.js';

/**
 * Parser constructor function
 *
 * @param config - Parser configuration
 */
export const Parser = function (this: IParserInternal, config: IParserConfig = {}) {
  // Initialize internal state
  this._tokens = [];
  this._current = 0;
  this._errors = [];
  this._source = '';
  this._lexer = createLexer();
} as unknown as { new (config?: IParserConfig): IParserInternal };
