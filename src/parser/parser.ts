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
<<<<<<< HEAD

  // Initialize debug tracking
  this._iterationCount = 0;
  this._maxIterations = 50000;
  this._recursionDepth = 0;
  this._currentNodeType = 'none';
  this._logger = config.logger;
=======
  this._expressionDepth = 0;
>>>>>>> 35c9f2b349e0cba67b8785a5e666c2a86450ad27
} as unknown as { new (config?: IParserConfig): IParserInternal };
