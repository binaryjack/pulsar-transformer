/**
 * Lexer tokenize method
 *
 * Main tokenization logic - converts source string into token array.
 */

import { Lexer } from '../lexer';
import type { ILexerInternal } from '../lexer.types';
import type { IToken } from '../token-types';
import { TokenType } from '../token-types';

/**
 * Tokenize source code into tokens
 *
 * @param source - PSR source code
 * @returns Array of tokens
 */
export function tokenize(this: ILexerInternal, source: string): IToken[] {
  // Reset internal state
  this._source = source;
  this._position = 0;
  this._line = 1;
  this._column = 1;
  this._tokens = [];
  this._current = 0;

  while (this._position < source.length) {
    const char = source[this._position];

    // Skip whitespace (spaces, tabs)
    if (char === ' ' || char === '\t') {
      this._position++;
      this._column++;
      continue;
    }

    // Handle newlines
    if (char === '\n' || char === '\r') {
      this._position++;
      this._line++;
      this._column = 1;
      continue;
    }

    // Try to recognize token
    const token = this._recognizeToken();

    if (token) {
      this._tokens.push(token);
    } else {
      // Unknown character - throw error
      throw new Error(
        `PSR-E001: Unexpected character '${char}' at line ${this._line}, column ${this._column}`
      );
    }
  }

  // Add EOF token
  this._tokens.push({
    type: TokenType.EOF,
    value: '',
    line: this._line,
    column: this._column,
    start: this._position,
    end: this._position,
  });

  return this._tokens;
}

/**
 * Internal token recognition
 *
 * @returns Recognized token or null
 */
function _recognizeToken(this: ILexerInternal): IToken | null {
  const char = this._source[this._position];
  const start = this._position;
  const line = this._line;
  const column = this._column;

  // Keywords and identifiers
  if (this._isAlpha(char)) {
    return this._readIdentifierOrKeyword(start, line, column);
  }

  // Numbers
  if (this._isDigit(char)) {
    return this._readNumber(start, line, column);
  }

  // Strings
  if (char === '"' || char === "'" || char === '`') {
    return this._readString(start, line, column);
  }

  // Signal binding: $(identifier)
  if (char === '$' && this._source[this._position + 1] === '(') {
    return this._readSignalBinding(start, line, column);
  }

  // Single character tokens
  return this._readSingleChar(start, line, column);
}

/**
 * Check if character is alphabetic
 */
function _isAlpha(this: ILexerInternal, char: string): boolean {
  return /[a-zA-Z_]/.test(char);
}

/**
 * Check if character is digit
 */
function _isDigit(this: ILexerInternal, char: string): boolean {
  return /[0-9]/.test(char);
}

/**
 * Check if character is alphanumeric
 */
function _isAlphaNumeric(this: ILexerInternal, char: string): boolean {
  return this._isAlpha(char) || this._isDigit(char);
}

/**
 * Read identifier or keyword
 */
function _readIdentifierOrKeyword(
  this: ILexerInternal,
  start: number,
  line: number,
  column: number
): IToken {
  let value = '';

  while (this._position < this._source.length) {
    const char = this._source[this._position];

    if (this._isAlphaNumeric(char)) {
      value += char;
      this._position++;
      this._column++;
    } else {
      break;
    }
  }

  // Check if it's a keyword
  const keywords: Record<string, TokenType> = {
    component: TokenType.COMPONENT,
    const: TokenType.CONST,
    let: TokenType.LET,
    return: TokenType.RETURN,
    import: TokenType.IMPORT,
    export: TokenType.EXPORT,
    from: TokenType.FROM,
  };

  const type = keywords[value] || TokenType.IDENTIFIER;

  return {
    type,
    value,
    line,
    column,
    start,
    end: this._position,
  };
}

/**
 * Read number literal
 */
function _readNumber(this: ILexerInternal, start: number, line: number, column: number): IToken {
  let value = '';

  while (this._position < this._source.length) {
    const char = this._source[this._position];

    if (this._isDigit(char) || char === '.') {
      value += char;
      this._position++;
      this._column++;
    } else {
      break;
    }
  }

  return {
    type: TokenType.NUMBER,
    value,
    line,
    column,
    start,
    end: this._position,
  };
}

/**
 * Read string literal
 */
function _readString(this: ILexerInternal, start: number, line: number, column: number): IToken {
  const quote = this._source[this._position];
  let value = '';

  this._position++; // Skip opening quote
  this._column++;

  while (this._position < this._source.length) {
    const char = this._source[this._position];

    if (char === quote) {
      this._position++; // Skip closing quote
      this._column++;
      break;
    }

    if (char === '\\') {
      // Handle escape sequences
      this._position++;
      this._column++;
      if (this._position < this._source.length) {
        value += this._source[this._position];
        this._position++;
        this._column++;
      }
    } else {
      value += char;
      this._position++;
      this._column++;
    }
  }

  return {
    type: TokenType.STRING,
    value,
    line,
    column,
    start,
    end: this._position,
  };
}

/**
 * Read signal binding: $(identifier)
 */
function _readSignalBinding(
  this: ILexerInternal,
  start: number,
  line: number,
  column: number
): IToken {
  let value = '$(';
  this._position += 2; // Skip $(
  this._column += 2;

  // Read identifier
  while (this._position < this._source.length) {
    const char = this._source[this._position];

    if (this._isAlphaNumeric(char)) {
      value += char;
      this._position++;
      this._column++;
    } else if (char === ')') {
      value += char;
      this._position++;
      this._column++;
      break;
    } else {
      throw new Error(`PSR-E002: Invalid signal binding at line ${line}, column ${column}`);
    }
  }

  return {
    type: TokenType.SIGNAL_BINDING,
    value,
    line,
    column,
    start,
    end: this._position,
  };
}

/**
 * Read single character token
 */
function _readSingleChar(
  this: ILexerInternal,
  start: number,
  line: number,
  column: number
): IToken | null {
  const char = this._source[this._position];

  const singleCharTokens: Record<string, TokenType> = {
    '(': TokenType.LPAREN,
    ')': TokenType.RPAREN,
    '{': TokenType.LBRACE,
    '}': TokenType.RBRACE,
    '[': TokenType.LBRACKET,
    ']': TokenType.RBRACKET,
    ';': TokenType.SEMICOLON,
    ',': TokenType.COMMA,
    '.': TokenType.DOT,
    ':': TokenType.COLON,
    '<': TokenType.LT,
    '>': TokenType.GT,
    '/': TokenType.SLASH,
    '+': TokenType.PLUS,
    '-': TokenType.MINUS,
    '*': TokenType.MULTIPLY,
    '=': TokenType.ASSIGN,
  };

  const type = singleCharTokens[char];

  if (type) {
    this._position++;
    this._column++;

    // Check for multi-char operators
    if (char === '=' && this._source[this._position] === '>') {
      this._position++;
      this._column++;
      return {
        type: TokenType.ARROW,
        value: '=>',
        line,
        column,
        start,
        end: this._position,
      };
    }

    return {
      type,
      value: char,
      line,
      column,
      start,
      end: this._position,
    };
  }

  return null;
}

// Attach private methods to prototype
Object.assign(Lexer.prototype, {
  _recognizeToken,
  _isAlpha,
  _isDigit,
  _isAlphaNumeric,
  _readIdentifierOrKeyword,
  _readNumber,
  _readString,
  _readSignalBinding,
  _readSingleChar,
});
