/**
 * Token Types for PSR Lexer
 * Based on TypeScript/Babel tokenization patterns
 */

import type { DiagnosticCollector } from './diagnostics.js';
import type { StateTransitionTracker } from './state-tracker.js';
import type { LexerDebugger } from './debug-tools.js';
import type { WarningSystem, RecoveryController, LexerOptions } from './warning-recovery.js';

export enum TokenTypeEnum {
  // Keywords
  IMPORT = 'IMPORT',
  FROM = 'FROM',
  EXPORT = 'EXPORT',
  DEFAULT = 'DEFAULT',
  INTERFACE = 'INTERFACE',
  COMPONENT = 'COMPONENT',
  CONST = 'CONST',
  LET = 'LET',
  VAR = 'VAR',
  FUNCTION = 'FUNCTION',
  RETURN = 'RETURN',
  IF = 'IF',
  ELSE = 'ELSE',
  FOR = 'FOR',
  WHILE = 'WHILE',
  NEW = 'NEW',
  THROW = 'THROW',
  INSTANCEOF = 'INSTANCEOF',
  TYPEOF = 'TYPEOF',
  DELETE = 'DELETE',

  // Identifiers & Literals
  IDENTIFIER = 'IDENTIFIER',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BIGINT = 'BIGINT', // BigInt literal (123n)
  REGEX = 'REGEX', // Regular expression literal (/pattern/flags)
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  NULL = 'NULL',
  UNDEFINED = 'UNDEFINED',

  // Template Literals
  TEMPLATE_LITERAL = 'TEMPLATE_LITERAL', // `simple template`
  TEMPLATE_HEAD = 'TEMPLATE_HEAD', // `start${
  TEMPLATE_MIDDLE = 'TEMPLATE_MIDDLE', // }middle${
  TEMPLATE_TAIL = 'TEMPLATE_TAIL', // }end`

  // Operators
  EQUALS = 'EQUALS', // =
  ARROW = 'ARROW', // =>
  COLON = 'COLON', // :
  QUESTION = 'QUESTION', // ?
  QUESTION_QUESTION = 'QUESTION_QUESTION', // ?? (nullish coalescing)
  QUESTION_DOT = 'QUESTION_DOT', // ?. (optional chaining)
  PLUS = 'PLUS', // +
  PLUS_PLUS = 'PLUS_PLUS', // ++
  MINUS = 'MINUS', // -
  MINUS_MINUS = 'MINUS_MINUS', // --
  STAR = 'STAR', // *
  SLASH = 'SLASH', // /
  PERCENT = 'PERCENT', // %
  EXPONENTIATION = 'EXPONENTIATION', // **
  AMPERSAND = 'AMPERSAND', // &
  PIPE = 'PIPE', // |
  EXCLAMATION = 'EXCLAMATION', // !
  EQUALS_EQUALS = 'EQUALS_EQUALS', // ==
  EQUALS_EQUALS_EQUALS = 'EQUALS_EQUALS_EQUALS', // ===
  NOT_EQUALS = 'NOT_EQUALS', // !=
  NOT_EQUALS_EQUALS = 'NOT_EQUALS_EQUALS', // !==
  AMPERSAND_AMPERSAND = 'AMPERSAND_AMPERSAND', // &&
  PIPE_PIPE = 'PIPE_PIPE', // ||

  // Bitwise & Shift Operators
  LT_LT = 'LT_LT', // <<
  GT_GT = 'GT_GT', // >>
  GT_GT_GT = 'GT_GT_GT', // >>>

  // Assignment Operators
  STAR_STAR_EQUALS = 'STAR_STAR_EQUALS', // **=
  QUESTION_QUESTION_EQUALS = 'QUESTION_QUESTION_EQUALS', // ??=
  AMPERSAND_AMPERSAND_EQUALS = 'AMPERSAND_AMPERSAND_EQUALS', // &&=
  PIPE_PIPE_EQUALS = 'PIPE_PIPE_EQUALS', // ||=
  LT_LT_EQUALS = 'LT_LT_EQUALS', // <<=
  GT_GT_EQUALS = 'GT_GT_EQUALS', // >>=
  GT_GT_GT_EQUALS = 'GT_GT_GT_EQUALS', // >>>=

  // Delimiters
  LPAREN = 'LPAREN', // (
  RPAREN = 'RPAREN', // )
  LBRACE = 'LBRACE', // {
  RBRACE = 'RBRACE', // }
  LBRACKET = 'LBRACKET', // [
  RBRACKET = 'RBRACKET', // ]
  LT = 'LT', // <
  GT = 'GT', // >
  LT_EQUALS = 'LT_EQUALS', // <=
  GT_EQUALS = 'GT_EQUALS', // >=
  SEMICOLON = 'SEMICOLON', // ;
  COMMA = 'COMMA', // ,
  DOT = 'DOT', // .
  SPREAD = 'SPREAD', // ...

  // JSX Tokens
  JSX_TAG_START = 'JSX_TAG_START', // <div
  JSX_TAG_END = 'JSX_TAG_END', // >
  JSX_TAG_CLOSE = 'JSX_TAG_CLOSE', // </div>
  JSX_SELF_CLOSE = 'JSX_SELF_CLOSE', // />
  JSX_EXPR_START = 'JSX_EXPR_START', // {
  JSX_EXPR_END = 'JSX_EXPR_END', // }
  JSX_TEXT = 'JSX_TEXT', // text content
  JSX_FRAGMENT_OPEN = 'JSX_FRAGMENT_OPEN', // <>
  JSX_FRAGMENT_CLOSE = 'JSX_FRAGMENT_CLOSE', // </>
  JSX_ATTR_NAME = 'JSX_ATTR_NAME', // attribute name
  JSX_ATTR_VALUE = 'JSX_ATTR_VALUE', // attribute value

  // Error Recovery
  ERROR = 'ERROR', // Used in recovery mode for problematic tokens

  // Special
  EOF = 'EOF',
  COMMENT = 'COMMENT',
  NEWLINE = 'NEWLINE',
}

/**
 * Lexer state for context-aware tokenization
 */
export enum LexerStateEnum {
  Normal = 'Normal', // Regular JavaScript/TypeScript
  InsideJSX = 'InsideJSX', // Inside JSX tag: <div ...>
  InsideJSXText = 'InsideJSXText', // Between JSX tags: <div>TEXT</div>
  InsideJSXExpression = 'InsideJSXExpression', // Inside JSX expression: {expr}
}

/**
 * Token interface with position tracking
 */
export interface IToken {
  type: TokenTypeEnum;
  value: string;
  start: number;
  end: number;
  line: number;
  column: number;
}

/**
 * Source position for tracking
 */
export interface ISourcePosition {
  line: number;
  column: number;
  offset: number;
}

/**
 * Lexer interface with complete diagnostic and tracking systems
 */
export interface ILexer {
  new (source: string, filePath?: string, options?: Partial<LexerOptions>): ILexer;

  // Input and configuration
  source: string;
  filePath: string;
  options: LexerOptions;

  // Position tracking
  pos: number;
  line: number;
  column: number;

  // Output
  tokens: IToken[];

  // Diagnostic and tracking systems
  diagnostics: DiagnosticCollector;
  stateTracker?: StateTransitionTracker;
  debugger?: LexerDebugger;
  warningSystem?: WarningSystem;
  recoveryController?: RecoveryController;

  /**
   * Current lexer state for context-aware tokenization
   */
  state: LexerStateEnum;

  /**
   * State stack for nested contexts (JSX in expressions)
   */
  stateStack: LexerStateEnum[];

  /**
   * JSX element nesting depth (0 = not in JSX)
   */
  jsxDepth: number;

  /**
   * Expression depth (tracks { and } for JSX expressions)
   */
  expressionDepth: number;

  /**
   * Parentheses depth (tracks ( and ) for arrow functions)
   */
  parenthesesDepth: number;

  /**
   * Flag: scanJSXText() just exited due to { - enter InsideJSXExpression
   */
  justExitedJSXTextForBrace: boolean;

  /**
   * Template literal nesting depth (0 = not in template)
   */
  templateDepth: number;

  // Core methods
  scanTokens(): IToken[];
  scanToken(): void;

  // Character methods
  advance(): void;
  peek(offset?: number): string;
  match(expected: string): boolean;
  isAtEnd(): boolean;

  // Token creation
  addToken(type: TokenTypeEnum, value?: string): void;

  // Scanning methods
  scanIdentifier(): void;
  scanString(quote: string): void;
  scanNumber(): void;
  scanComment(): void;
  scanJSXText(): void;
  scanTemplate(): void;
  scanRegex(): void;

  // Helper methods
  isKeyword(text: string): TokenTypeEnum | null;
  skipWhitespace(): void;

  // State management
  pushState(state: LexerStateEnum): void;
  popState(): void;
  getState(): LexerStateEnum;
  isInJSX(): boolean;

  // Diagnostic methods
  addDiagnostic(
    code: string,
    message: string,
    line: number,
    column: number,
    suggestion?: string
  ): void;
  getDiagnostics(): any[];
  hasErrors(): boolean;

  // Debug methods
  captureSnapshot(label?: string): any;
  getDebugInfo(): any;
}

/**
 * Keyword map for fast lookup
 */
export const KEYWORDS: Record<string, TokenTypeEnum> = {
  import: TokenTypeEnum.IMPORT,
  from: TokenTypeEnum.FROM,
  export: TokenTypeEnum.EXPORT,
  default: TokenTypeEnum.DEFAULT,
  interface: TokenTypeEnum.INTERFACE,
  component: TokenTypeEnum.COMPONENT,
  const: TokenTypeEnum.CONST,
  let: TokenTypeEnum.LET,
  var: TokenTypeEnum.VAR,
  function: TokenTypeEnum.FUNCTION,
  return: TokenTypeEnum.RETURN,
  if: TokenTypeEnum.IF,
  else: TokenTypeEnum.ELSE,
  for: TokenTypeEnum.FOR,
  while: TokenTypeEnum.WHILE,
  true: TokenTypeEnum.TRUE,
  false: TokenTypeEnum.FALSE,
  null: TokenTypeEnum.NULL,
  undefined: TokenTypeEnum.UNDEFINED,
};

/**
 * Character classification helpers
 */
export function isAlpha(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' || ch === '$';
}

export function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

export function isAlphaNumeric(ch: string): boolean {
  return isAlpha(ch) || isDigit(ch);
}

export function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\r';
}

export function isNewline(ch: string): boolean {
  return ch === '\n';
}
