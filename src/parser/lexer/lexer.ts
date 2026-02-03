/**
 * PSR Lexer Constructor
 *
 * Prototype-based lexer for PSR syntax.
 * Tokenizes PSR source code into tokens for parser consumption.
 */

import type { ILexerConfig, ILexerInternal } from './lexer.types';

/**
 * Lexer constructor function
 *
 * @param config - Lexer configuration
 */
export const Lexer = function (this: ILexerInternal, config: ILexerConfig = {}) {
  // Private properties using Object.defineProperty for encapsulation
  Object.defineProperty(this, '_source', {
    value: '',
    writable: true,
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(this, '_position', {
    value: 0,
    writable: true,
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(this, '_line', {
    value: 1,
    writable: true,
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(this, '_column', {
    value: 1,
    writable: true,
    enumerable: false,
    configurable: false,
  });

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
} as unknown as { new (config?: ILexerConfig): ILexerInternal };
