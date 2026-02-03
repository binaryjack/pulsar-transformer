/**
 * Parser Types
 * 
 * Type definitions for the PSR parser.
 * Prototype-based pattern, following Pulsar standards.
 */

import type { IToken } from './lexer';
import type { IASTNode } from './ast';

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
