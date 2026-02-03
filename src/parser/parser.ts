/**
 * PSR Parser Constructor
 *
 * Prototype-based parser for PSR syntax.
 * Converts tokens into Abstract Syntax Tree (AST).
 */

import type { IParserConfig, IParserInternal } from './parser.types.js';

/**
 * Parser constructor function
 *
 * @param config - Parser configuration
 */
export const Parser = function (this: IParserInternal, config: IParserConfig = {}) {
  // Private properties using Object.defineProperty for encapsulation
  Object.defineProperty(this, '_tokens', {
    value: [],
    writable: true,
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(this, '_current', {
    value: 0,
    writable: true,
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(this, '_errors', {
    value: [],
    writable: true,
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(this, '_source', {
    value: '',
    writable: true,
    enumerable: false,
    configurable: false,
  });
} as unknown as { new (config?: IParserConfig): IParserInternal };
