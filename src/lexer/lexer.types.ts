/**
 * Token Types for PSR Lexer
 * Based on TypeScript/Babel tokenization patterns
 */

export enum TokenTypeEnum {
  // Keywords
  IMPORT = 'IMPORT',
  FROM = 'FROM',
  EXPORT = 'EXPORT',
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

  // Identifiers & Literals
  IDENTIFIER = 'IDENTIFIER',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  NULL = 'NULL',
  UNDEFINED = 'UNDEFINED',

  // Operators
  EQUALS = 'EQUALS', // =
  ARROW = 'ARROW', // =>
  COLON = 'COLON', // :
  QUESTION = 'QUESTION', // ?
  PLUS = 'PLUS', // +
  MINUS = 'MINUS', // -
  STAR = 'STAR', // *
  SLASH = 'SLASH', // /
  PERCENT = 'PERCENT', // %
  AMPERSAND = 'AMPERSAND', // &
  PIPE = 'PIPE', // |
  EXCLAMATION = 'EXCLAMATION', // !
  EQUALS_EQUALS = 'EQUALS_EQUALS', // ==
  EQUALS_EQUALS_EQUALS = 'EQUALS_EQUALS_EQUALS', // ===
  NOT_EQUALS = 'NOT_EQUALS', // !=
  NOT_EQUALS_EQUALS = 'NOT_EQUALS_EQUALS', // !==
  AMPERSAND_AMPERSAND = 'AMPERSAND_AMPERSAND', // &&
  PIPE_PIPE = 'PIPE_PIPE', // ||

  // Delimiters
  LPAREN = 'LPAREN', // (
  RPAREN = 'RPAREN', // )
  LBRACE = 'LBRACE', // {
  RBRACE = 'RBRACE', // }
  LBRACKET = 'LBRACKET', // [
  RBRACKET = 'RBRACKET', // ]
  LT = 'LT', // <
  GT = 'GT', // >
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
  JSX_ATTR_NAME = 'JSX_ATTR_NAME', // attribute name
  JSX_ATTR_VALUE = 'JSX_ATTR_VALUE', // attribute value

  // Special
  EOF = 'EOF',
  COMMENT = 'COMMENT',
  NEWLINE = 'NEWLINE',
}

/**
 * Lexer state for context-aware tokenization
 */
export enum LexerStateEnum {
  Normal = 'Normal',           // Regular JavaScript/TypeScript
  InsideJSX = 'InsideJSX',     // Inside JSX tag: <div ...>
  InsideJSXText = 'InsideJSXText', // Between JSX tags: <div>TEXT</div>
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
 * Lexer interface (prototype-based class)
 */
export interface ILexer {
  new (source: string, filePath?: string): ILexer;

  // State
  source: string;
  filePath: string;
  pos: number;
  line: number;
  column: number;
  tokens: IToken[];
  
  /**
   * Current lexer state for context-aware tokenization
   */
  state: LexerStateEnum;
  
  /**
   * State stack for nested contexts (JSX in expressions)
   */
  stateStack: LexerStateEnum[];

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

  // Helper methods
  isKeyword(text: string): TokenTypeEnum | null;
  skipWhitespace(): void;
  
  // State management
  pushState(state: LexerStateEnum): void;
  popState(): void;
  getState(): LexerStateEnum;
  isInJSX(): boolean;
}

/**
 * Keyword map for fast lookup
 */
export const KEYWORDS: Record<string, TokenTypeEnum> = {
  import: TokenTypeEnum.IMPORT,
  from: TokenTypeEnum.FROM,
  export: TokenTypeEnum.EXPORT,
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
