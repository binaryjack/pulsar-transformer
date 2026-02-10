/**
 * Parser Types
 *
 * Type definitions for the PSR parser.
 * Prototype-based pattern, following Pulsar standards.
 */

import type { IDebugLogger } from '../debug/debug-logger.types.js';
import type { IASTNode } from './ast/index.js';
import type { ILexer, IToken } from './lexer/index.js';

/**
 * Public Parser interface
 */
export interface IParser {
  /**
   * Parse PSR source code into AST
   */
  parse(source: string): IASTNode;

  /**
   * Get current parsing position
   */
  getPosition(): IParserPosition;

  /**
   * Check if parser has errors
   */
  hasErrors(): boolean;

  /**
   * Get parsing errors
   */
  getErrors(): IParserError[];
}

/**
 * Internal Parser interface (for prototype methods)
 */
export interface IParserInternal extends IParser {
  _tokens: IToken[];
  _current: number;
  _errors: IParserError[];
  _source: string;
  _lexer: ILexer; // Lexer instance for type context control
  _expressionDepth: number; // Track expression parsing recursion depth
  _inJSXAttributeExpression: boolean; // Context flag to prevent infinite JSX recursion

  // Debug tracking
  _iterationCount?: number;
  _maxIterations?: number;
  _recursionDepth?: number;
  _currentNodeType?: string;
  _logger?: IDebugLogger;

  // Private parsing methods
  _parseStatement(): any;
  _parseComponentDeclaration(): any;
  _parseVariableDeclaration(): any;
  _parseFunctionDeclaration(): any;
  _parseClassDeclaration(): any;
  _parseEnumDeclaration(): any;
  _parseNamespaceDeclaration(): any;
  _skipTypeAlias(): void;
  _parseInterfaceDeclaration(): any;
  _parseTypeAlias(): any;
  _parseReturnStatement(): any;
  _parseTryStatement(): any;
  _parseSwitchStatement(): any;
  _parseThrowStatement(): any;
  _parseIfStatement(): any;
  _parseForStatement(): any;
  _parseWhileStatement(): any;
  _parseDoWhileStatement(): any;
  _parseBreakStatement(): any;
  _parseContinueStatement(): any;
  _parseBlockStatement(): any;
  _parseDecorator(): any;
  _parseYieldExpression(): any;
  _parseAwaitExpression(): any;
  _parsePSRElement(): any;
  _parseJSXFragment(): any;
  _parsePSRSignalBinding(): any;
  _parsePSRAttribute(): any;
  _parsePSRChild(parentTagName?: string): any;
  _parseJSXExpression(): any;
  _parseNonObjectExpression(): any;
  _parseExpression(): any;
  _parseExpressionStatement(): any;
  _parseImportDeclaration(): any;
  _parseExportDeclaration(): any;
  _parseArrowFunctionOrGrouping(): any;
  _parseCallOrIdentifier(): any;
  _parseLiteral(): any;
  _parseTemplateLiteral(): any;
  _parseObjectLiteral(): any;
  _parseArrayLiteral(): any;
  _isKeywordAsIdentifier(): boolean;

  // Helper methods
  _isAtEnd(): boolean;
  _getCurrentToken(): IToken | undefined;
  _advance(): IToken;
  _check(type: string): boolean;
  _match(...types: string[]): boolean;
  _expect(type: string, message: string): IToken;
  _addError(error: IParserError): void;
  _isClosingTag(tagName: string): boolean;
  _isClosingFragment(): boolean;
  _peek(offset: number): IToken | undefined;
}

/**
 * Parser configuration
 */
export interface IParserConfig {
  /**
   * Collect errors instead of throwing (default: true)
   */
  collectErrors?: boolean;

  /**
   * Maximum number of errors before stopping (default: 10)
   */
  maxErrors?: number;

  /**
   * Debug logger instance
   */
  logger?: IDebugLogger;

  /**
   * Enable debug mode
   */
  debug?: boolean;
}

/**
 * Parser position information
 */
export interface IParserPosition {
  readonly current: number;
  readonly token: IToken | null;
}

/**
 * Parser error
 */
export interface IParserError {
  readonly code: string;
  readonly message: string;
  readonly location: {
    readonly line: number;
    readonly column: number;
  };
  readonly token?: IToken;
}
