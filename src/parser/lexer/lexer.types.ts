/**
 * Lexer Types
 *
 * Type definitions for the PSR lexer.
 * Prototype-based pattern, following Pulsar standards.
 */

import type { IToken } from './token-types';

/**
 * Public Lexer interface
 */
export interface ILexer {
  /**
   * Tokenize input source code
   */
  tokenize(source: string): IToken[];

  /**
   * Get next token without consuming it
   */
  peek(): IToken | null;

  /**
   * Get current position
   */
  getPosition(): ILexerPosition;
}

/**
 * Internal Lexer interface (for prototype methods)
 */
export interface ILexerInternal extends ILexer {
  _source: string;
  _position: number;
  _line: number;
  _column: number;
  _tokens: IToken[];
  _current: number;
}

/**
 * Lexer configuration
 */
export interface ILexerConfig {
  /**
   * Skip whitespace tokens (default: true)
   */
  skipWhitespace?: boolean;

  /**
   * Skip comment tokens (default: true)
   */
  skipComments?: boolean;

  /**
   * Preserve newlines as tokens (default: false)
   */
  preserveNewlines?: boolean;
}

/**
 * Lexer position information
 */
export interface ILexerPosition {
  readonly position: number;
  readonly line: number;
  readonly column: number;
}

/**
 * Token recognizer function type
 */
export type TokenRecognizer = (char: string, source: string, position: number) => IToken | null;
