/**
 * PSR Token Types
 *
 * Defines all token types recognized by the PSR lexer.
 * Following Pulsar standards: one item per file, explicit types.
 */

export enum TokenType {
  // Keywords
  COMPONENT = 'COMPONENT',
  CONST = 'CONST',
  LET = 'LET',
  RETURN = 'RETURN',
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  FROM = 'FROM',
  AS = 'AS', // as (for namespace imports)
  TYPE = 'TYPE', // type (for type imports/exports)

  // Identifiers and Literals
  IDENTIFIER = 'IDENTIFIER',
  STRING = 'STRING',
  NUMBER = 'NUMBER',

  // Operators
  ASSIGN = 'ASSIGN', // =
  PLUS = 'PLUS', // +
  MINUS = 'MINUS', // -
  MULTIPLY = 'MULTIPLY', // *
  DIVIDE = 'DIVIDE', // /
  ARROW = 'ARROW', // =>

  // Delimiters
  LPAREN = 'LPAREN', // (
  RPAREN = 'RPAREN', // )
  LBRACE = 'LBRACE', // {
  RBRACE = 'RBRACE', // }
  LBRACKET = 'LBRACKET', // [
  RBRACKET = 'RBRACKET', // ]
  SEMICOLON = 'SEMICOLON', // ;
  COMMA = 'COMMA', // ,
  DOT = 'DOT', // .
  COLON = 'COLON', // :

  // JSX-like
  LT = 'LT', // <
  GT = 'GT', // >
  SLASH = 'SLASH', // /

  // PSR-specific
  SIGNAL_BINDING = 'SIGNAL_BINDING', // $(identifier)

  // Special
  EOF = 'EOF',
  WHITESPACE = 'WHITESPACE',
  NEWLINE = 'NEWLINE',
  COMMENT = 'COMMENT',
}

/**
 * Token interface
 */
export interface IToken {
  readonly type: TokenType;
  readonly value: string;
  readonly line: number;
  readonly column: number;
  readonly start: number;
  readonly end: number;
}

/**
 * Token location information
 */
export interface ITokenLocation {
  readonly line: number;
  readonly column: number;
  readonly start: number;
  readonly end: number;
}
