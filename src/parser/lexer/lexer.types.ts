/**
 * Lexer Types
 *
 * Type definitions for the PSR lexer.
 * Prototype-based pattern, following Pulsar standards.
 */

import type { IToken } from './token-types.js';

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

  // JSX context tracking
  _jsxBraceDepth: number;
  _inJSXExpression: boolean;
  _inJSXElement: boolean;

  // Private helper methods
  _recognizeToken(start: number, line: number, column: number): IToken | null;
  _isAlpha(char: string): boolean;
  _isDigit(char: string): boolean;
  _isAlphaNumeric(char: string): boolean;
  _readIdentifierOrKeyword(start: number, line: number, column: number): IToken;
  _readNumber(start: number, line: number, column: number): IToken;
  _readString(start: number, line: number, column: number): IToken;
  _readTemplateLiteral(start: number, line: number, column: number): IToken;
  _readSignalBinding(start: number, line: number, column: number): IToken;
  _readSingleChar(start: number, line: number, column: number): IToken | null;
  _readSingleLineComment(start: number, line: number, column: number): IToken | null;
  _readMultiLineComment(start: number, line: number, column: number): IToken | null;
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
