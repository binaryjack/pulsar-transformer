/**
 * PSR Lexer Constructor
 *
 * Prototype-based lexer for PSR syntax.
 * Tokenizes PSR source code into tokens for parser consumption.
 */

import type { ILexerConfig, ILexerInternal } from './lexer.types.js';
import { ScanMode } from './lexer.types.js';

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

  Object.defineProperty(this, '_lineStart', {
    value: 0,
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

  // JSX context tracking properties
  Object.defineProperty(this, '_jsxBraceDepth', {
    value: 0,
    writable: true,
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(this, '_inJSXExpression', {
    value: false,
    writable: true,
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(this, '_inJSXElement', {
    value: false,
    writable: true,
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(this, '_scanMode', {
    value: ScanMode.JAVASCRIPT,
    writable: true,
    enumerable: false,
    configurable: false,
  });

  // Type context tracking properties
  Object.defineProperty(this, '_inTypeLevel', {
    value: 0,
    writable: true,
    enumerable: false,
    configurable: false,
  });

  // Template literal state tracking
  Object.defineProperty(this, '_templateLiteralStack', {
    value: [],
    writable: true,
    enumerable: false,
    configurable: false,
  });
} as unknown as { new (config?: ILexerConfig): ILexerInternal };
