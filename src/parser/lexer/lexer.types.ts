/**
 * Lexer Types
 *
 * Type definitions for the PSR lexer.
 * Prototype-based pattern, following Pulsar standards.
 */

import type { IToken, TokenType } from './token-types.js';

/**
 * Scanning modes for lexer context switching
 */
export enum ScanMode {
  JAVASCRIPT = 0,
  JSX_TEXT = 1,
  JSX_ATTRIBUTE_VALUE = 2,
}

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

  /**
   * Enter JSX element context
   */
  enterJSXElement(): void;

  /**
   * Exit JSX element context
   */
  exitJSXElement(): void;

  /**
   * Enter JSX expression context
   */
  enterJSXExpression(): void;

  /**
   * Exit JSX expression context
   */
  exitJSXExpression(): void;

  /**
   * Enter type context (for generic type parameters)
   */
  enterTypeContext(): void;

  /**
   * Exit type context
   */
  exitTypeContext(): void;

  /**
   * Check if currently in type context
   */
  isInTypeContext(): boolean;

  /**
   * Re-scan less than token for generic type parameter detection
   */
  reScanLessThanToken(): TokenType | undefined;

  /**
   * Re-scan greater than token for generic type parameter detection
   */
  reScanGreaterThanToken(): TokenType | undefined;

  /**
   * Re-scan template token after expression in template literal
   */
  reScanTemplateToken(): IToken;

  /**
   * Check if what follows can be a type argument in expression
   */
  canFollowTypeArguments(): boolean;
}

/**
 * Internal Lexer interface (for prototype methods)
 */
export interface ILexerInternal extends ILexer {
  _source: string;
  _position: number;
  _line: number;
  _lineStart: number;
  _tokens: IToken[];
  _current: number;

  // JSX context tracking
  _jsxBraceDepth: number;
  _inJSXExpression: boolean;
  _inJSXElement: boolean;
  _scanMode: ScanMode;

  // Template literal state tracking
  _templateLiteralStack: Array<{ head: boolean }> | undefined;

  // Type context tracking (for generic types)
  _inTypeLevel: number;

  // Re-scan methods for angle bracket disambiguation
  reScanLessThanToken(): TokenType | undefined;
  reScanGreaterThanToken(): TokenType | undefined;
  canFollowTypeArguments(): boolean;

  // Private helper methods
  _getCurrentColumn(): number;
  _isGenericAngleBracket(): boolean;
  _recognizeToken(start: number, line: number, column: number): IToken | null;
  _isAlpha(char: string): boolean;
  _isDigit(char: string): boolean;
  _isAlphaNumeric(char: string): boolean;
  _readIdentifierOrKeyword(start: number, line: number, column: number): IToken;
  _readNumber(start: number, line: number, column: number): IToken;
  _readString(start: number, line: number, column: number): IToken;
  _readTemplateToken(start: number, line: number, column: number): IToken;
  _scanTemplateAndSetTokenValue(
    shouldEmitInvalidEscapeError: boolean,
    isContinuation?: boolean
  ): IToken;
  reScanTemplateToken(): IToken;
  _readSignalBinding(start: number, line: number, column: number): IToken;
  _readSingleChar(start: number, line: number, column: number): IToken | null;
  _readSingleLineComment(start: number, line: number, column: number): IToken | null;
  _readMultiLineComment(start: number, line: number, column: number): IToken | null;
  _scanJSXText(start: number, line: number, column: number): IToken | null;
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
