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
  FUNCTION = 'FUNCTION',
  CLASS = 'CLASS', // class (for class declarations)
  ASYNC = 'ASYNC',
  RETURN = 'RETURN',
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  FROM = 'FROM',
  AS = 'AS', // as (for namespace imports)
  TYPE = 'TYPE', // type (for type imports/exports)
  INTERFACE = 'INTERFACE', // interface (for interface declarations)
  EXTENDS = 'EXTENDS', // extends (for interface/class inheritance)
  ENUM = 'ENUM', // enum (for enum declarations)
  NAMESPACE = 'NAMESPACE', // namespace (for namespace declarations)
  MODULE = 'MODULE', // module (for module declarations)

  // Control flow keywords
  IF = 'IF', // if
  ELSE = 'ELSE', // else
  SWITCH = 'SWITCH', // switch
  CASE = 'CASE', // case
  DEFAULT = 'DEFAULT', // default (for switch)
  FOR = 'FOR', // for
  WHILE = 'WHILE', // while
  DO = 'DO', // do
  BREAK = 'BREAK', // break
  CONTINUE = 'CONTINUE', // continue
  TRY = 'TRY', // try
  CATCH = 'CATCH', // catch
  FINALLY = 'FINALLY', // finally
  THROW = 'THROW', // throw

  // Class-related keywords
  SUPER = 'SUPER', // super (for parent class calls)
  STATIC = 'STATIC', // static (for static members)
  GET = 'GET', // get (for getter methods)
  SET = 'SET', // set (for setter methods)
  ABSTRACT = 'ABSTRACT', // abstract (for abstract classes/methods)
  PUBLIC = 'PUBLIC', // public (access modifier)
  PRIVATE = 'PRIVATE', // private (access modifier)
  PROTECTED = 'PROTECTED', // protected (access modifier)
  READONLY = 'READONLY', // readonly (for readonly properties)
  OVERRIDE = 'OVERRIDE', // override (for method overriding)
  CONSTRUCTOR = 'CONSTRUCTOR', // constructor (for class constructor)

  // Generator & Async keywords
  YIELD = 'YIELD', // yield (for generators)
  AWAIT = 'AWAIT', // await (for async/await)

  // Decorator
  AT = 'AT', // @ (for decorators)

  // Identifiers and Literals
  IDENTIFIER = 'IDENTIFIER',
  STRING = 'STRING',
  NUMBER = 'NUMBER',

  // Operators
  ASSIGN = 'ASSIGN', // =
  PLUS = 'PLUS', // +
  MINUS = 'MINUS', // -
  MULTIPLY = 'MULTIPLY', // *
  ASTERISK = 'ASTERISK', // * (for generator functions and namespace imports)
  DIVIDE = 'DIVIDE', // /
  ARROW = 'ARROW', // =>
  PIPE = 'PIPE', // | (for union types)
  AMPERSAND = 'AMPERSAND', // & (for intersection types)

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
  QUESTION = 'QUESTION', // ? (for optional properties)

  // JSX-like
  LT = 'LT', // <
  GT = 'GT', // >
  SLASH = 'SLASH', // /
  SPREAD = 'SPREAD', // ... (for spread attributes)

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
