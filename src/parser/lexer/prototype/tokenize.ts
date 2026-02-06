/**
 * Lexer tokenize method
 *
 * Main tokenization logic - converts source string into token array.
 */

import { Lexer } from '../lexer.js';
import type { ILexerInternal } from '../lexer.types.js';
import type { IToken } from '../token-types.js';
import { TokenType } from '../token-types.js';

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

  // Reset JSX context tracking
  this._jsxBraceDepth = 0;
  this._inJSXExpression = false;
  this._inJSXElement = false;

  while (this._position < source.length) {
    // Use proper Unicode iteration to handle surrogate pairs
    const char = source[this._position];
    let currentCodePoint = char.codePointAt(0) ?? 0;
    let currentChar = char;

    // Handle surrogate pairs properly
    if (currentCodePoint >= 0xd800 && currentCodePoint <= 0xdbff) {
      // High surrogate, need to get the full character with low surrogate
      if (this._position + 1 < source.length) {
        const nextChar = source[this._position + 1];
        const nextCodePoint = nextChar.charCodeAt(0);
        if (nextCodePoint >= 0xdc00 && nextCodePoint <= 0xdfff) {
          // Valid surrogate pair
          currentChar = char + nextChar;
          currentCodePoint = currentChar.codePointAt(0) ?? 0;
        }
      }
    }

    // Skip Unicode whitespace (spaces, tabs, and Unicode whitespace)
    if (/\p{White_Space}/u.test(currentChar)) {
      this._position += currentChar.length;
      this._column += currentChar.length;
      continue;
    }

    // Handle Unicode line terminators and newlines
    if (
      /\p{Line_Separator}|\p{Paragraph_Separator}/u.test(currentChar) ||
      currentChar === '\n' ||
      currentChar === '\r'
    ) {
      this._position += currentChar.length;
      this._line++;
      this._column = 1;
      continue;
    }

    // Try to recognize token
    const startPosition = this._position;
    const token = this._recognizeToken(this._position, this._line, this._column);

    if (token) {
      this._tokens.push(token);
    } else if (this._position > startPosition) {
      // Position advanced but no token returned (e.g., skipped comment)
      // Continue to next iteration
      continue;
    } else {
      // Filter problematic characters (null, control chars)
      if (currentCodePoint === 0 || /\p{Control}/u.test(currentChar)) {
        this._position += currentChar.length; // Skip silently
        this._column += currentChar.length;
        continue;
      }

      // Handle Unicode characters including emoji (properly handle surrogate pairs)
      if (currentCodePoint !== 0) {
        // Check if character is a valid Unicode character that should be tokenized as text content
        const isValidTextChar =
          // Emoji ranges (using codePointAt which handles surrogates properly)
          (currentCodePoint >= 0x1f300 && currentCodePoint <= 0x1f9ff) || // Misc Symbols and Pictographs, Emoticons, etc.
          (currentCodePoint >= 0x2600 && currentCodePoint <= 0x26ff) || // Misc symbols
          (currentCodePoint >= 0x2700 && currentCodePoint <= 0x27bf) || // Dingbats
          (currentCodePoint >= 0xfe00 && currentCodePoint <= 0xfe0f) || // Variation Selectors
          (currentCodePoint >= 0x1f000 && currentCodePoint <= 0x1f02f) || // Mahjong Tiles, Domino Tiles
          (currentCodePoint >= 0x1f0a0 && currentCodePoint <= 0x1f0ff) || // Playing Cards
          (currentCodePoint >= 0x1f100 && currentCodePoint <= 0x1f64f) || // Enclosed chars, emoticons
          (currentCodePoint >= 0x1f680 && currentCodePoint <= 0x1f6ff) || // Transport and Map
          (currentCodePoint >= 0x1f900 && currentCodePoint <= 0x1f9ff) || // Supplemental Symbols
          // Other special characters that might appear in text
          (currentCodePoint >= 0x2000 && currentCodePoint <= 0x206f) || // General Punctuation
          (currentCodePoint >= 0x2070 && currentCodePoint <= 0x209f) || // Superscripts and Subscripts
          (currentCodePoint >= 0x2190 && currentCodePoint <= 0x21ff) || // Arrows
          (currentCodePoint >= 0x2200 && currentCodePoint <= 0x22ff) || // Mathematical Operators
          (currentCodePoint >= 0x2300 && currentCodePoint <= 0x23ff) || // Miscellaneous Technical
          (currentCodePoint >= 0x25a0 && currentCodePoint <= 0x25ff); // Geometric Shapes

        if (isValidTextChar) {
          // Use the properly constructed Unicode character
          this._tokens.push({
            type: TokenType.IDENTIFIER,
            value: currentChar,
            line: this._line,
            column: this._column,
            start: this._position,
            end: this._position + currentChar.length,
          });

          this._position += currentChar.length;
          this._column += currentChar.length;
          continue;
        }
      }

      // Still throw for truly unexpected characters
      throw new Error(
        `PSR-E001: Unexpected character '${currentChar}' (U+${currentCodePoint.toString(16).toUpperCase()}) at line ${this._line}, column ${this._column}`
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
  if (char === '"' || char === "'") {
    return this._readString(start, line, column);
  }

  // Template literals
  if (char === '`') {
    return this._readTemplateLiteral(start, line, column);
  }

  // Signal binding: $(identifier)
  if (char === '$' && this._source[this._position + 1] === '(') {
    return this._readSignalBinding(start, line, column);
  }

  // Comments: // and /* */
  if (char === '/') {
    const nextChar = this._source[this._position + 1];

    // Single-line comment: //
    if (nextChar === '/') {
      return this._readSingleLineComment(start, line, column);
    }

    // Multi-line comment: /* */
    if (nextChar === '*') {
      return this._readMultiLineComment(start, line, column);
    }
  }

  // Single character tokens
  return this._readSingleChar(start, line, column);
}

/**
 * Check if character is alphabetic (Unicode-aware)
 */
function _isAlpha(this: ILexerInternal, char: string): boolean {
  return /\p{Letter}|_/u.test(char);
}

/**
 * Check if character is digit (Unicode-aware)
 */
function _isDigit(this: ILexerInternal, char: string): boolean {
  return /\p{Number}/u.test(char);
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
    function: TokenType.FUNCTION,
    class: TokenType.CLASS,
    async: TokenType.ASYNC,
    return: TokenType.RETURN,
    import: TokenType.IMPORT,
    export: TokenType.EXPORT,
    from: TokenType.FROM,
    as: TokenType.AS,
    type: TokenType.TYPE,
    interface: TokenType.INTERFACE,
    extends: TokenType.EXTENDS,
    enum: TokenType.ENUM,
    namespace: TokenType.NAMESPACE,
    module: TokenType.MODULE,
    if: TokenType.IF,
    else: TokenType.ELSE,
    switch: TokenType.SWITCH,
    case: TokenType.CASE,
    default: TokenType.DEFAULT,
    for: TokenType.FOR,
    while: TokenType.WHILE,
    do: TokenType.DO,
    break: TokenType.BREAK,
    continue: TokenType.CONTINUE,
    try: TokenType.TRY,
    catch: TokenType.CATCH,
    finally: TokenType.FINALLY,
    throw: TokenType.THROW,
    super: TokenType.SUPER,
    static: TokenType.STATIC,
    get: TokenType.GET,
    set: TokenType.SET,
    abstract: TokenType.ABSTRACT,
    public: TokenType.PUBLIC,
    private: TokenType.PRIVATE,
    protected: TokenType.PROTECTED,
    readonly: TokenType.READONLY,
    override: TokenType.OVERRIDE,
    constructor: TokenType.CONSTRUCTOR,
    yield: TokenType.YIELD,
    await: TokenType.AWAIT,
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
 * Read template literal (simplified - treats entire content as string)
 */
function _readTemplateLiteral(
  this: ILexerInternal,
  start: number,
  line: number,
  column: number
): IToken {
  let value = '';

  this._position++; // Skip opening backtick
  this._column++;

  while (this._position < this._source.length) {
    const char = this._source[this._position];

    if (char === '`') {
      this._position++; // Skip closing backtick
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
      if (char === '\n') {
        this._line++;
        this._column = 1;
      } else {
        this._column++;
      }
    }
  }

  return {
    type: TokenType.TEMPLATE_LITERAL,
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
    '?': TokenType.QUESTION,
    '!': TokenType.EXCLAMATION,
    '<': TokenType.LT,
    '>': TokenType.GT,
    '/': TokenType.SLASH,
    '+': TokenType.PLUS,
    '-': TokenType.MINUS,
    '*': TokenType.ASTERISK,
    '%': TokenType.MODULO,
    '=': TokenType.ASSIGN,
    '|': TokenType.PIPE,
    '&': TokenType.AMPERSAND,
    '@': TokenType.AT,
  };

  const type = singleCharTokens[char];

  if (type) {
    this._position++;
    this._column++;

    // Track JSX context for proper string handling in JSX expressions
    if (char === '<') {
      // Check if this is likely JSX (< followed by letter or /)
      const nextChar = this._source[this._position];
      if (nextChar && (this._isAlpha(nextChar) || nextChar === '/')) {
        this._inJSXElement = true;
      }
    } else if (char === '>') {
      // Exiting JSX tag, but may still be in JSX expression
      this._inJSXElement = false;
    } else if (char === '{') {
      // Entering JSX expression if we're in a JSX element
      if (this._inJSXElement || this._jsxBraceDepth > 0) {
        this._jsxBraceDepth++;
        this._inJSXExpression = true;
      }
    } else if (char === '}') {
      // Exiting JSX expression
      if (this._jsxBraceDepth > 0) {
        this._jsxBraceDepth--;
        if (this._jsxBraceDepth === 0) {
          this._inJSXExpression = false;
        }
      }
    }

    // Check for multi-char operators
    if (char === '=' && this._source[this._position] === '=') {
      if (this._source[this._position + 1] === '=') {
        this._position += 2;
        this._column += 2;
        return {
          type: TokenType.STRICT_EQUALS,
          value: '===',
          line,
          column,
          start,
          end: this._position,
        };
      }

      this._position++;
      this._column++;
      return {
        type: TokenType.EQUALS,
        value: '==',
        line,
        column,
        start,
        end: this._position,
      };
    }

    if (char === '!' && this._source[this._position] === '=') {
      if (this._source[this._position + 1] === '=') {
        this._position += 2;
        this._column += 2;
        return {
          type: TokenType.STRICT_NOT_EQUALS,
          value: '!==',
          line,
          column,
          start,
          end: this._position,
        };
      }

      this._position++;
      this._column++;
      return {
        type: TokenType.NOT_EQUALS,
        value: '!=',
        line,
        column,
        start,
        end: this._position,
      };
    }

    if (char === '<' && this._source[this._position] === '=') {
      this._position++;
      this._column++;
      return {
        type: TokenType.LT_EQUAL,
        value: '<=',
        line,
        column,
        start,
        end: this._position,
      };
    }

    if (char === '>' && this._source[this._position] === '=') {
      this._position++;
      this._column++;
      return {
        type: TokenType.GT_EQUAL,
        value: '>=',
        line,
        column,
        start,
        end: this._position,
      };
    }

    if (char === '&' && this._source[this._position] === '&') {
      this._position++;
      this._column++;
      return {
        type: TokenType.AND_AND,
        value: '&&',
        line,
        column,
        start,
        end: this._position,
      };
    }

    if (char === '|' && this._source[this._position] === '|') {
      this._position++;
      this._column++;
      return {
        type: TokenType.OR_OR,
        value: '||',
        line,
        column,
        start,
        end: this._position,
      };
    }

    // Check for increment operator: ++
    if (char === '+' && this._source[this._position] === '+') {
      this._position++;
      this._column++;
      return {
        type: TokenType.PLUS_PLUS,
        value: '++',
        line,
        column,
        start,
        end: this._position,
      };
    }

    // Check for decrement operator: --
    if (char === '-' && this._source[this._position] === '-') {
      this._position++;
      this._column++;
      return {
        type: TokenType.MINUS_MINUS,
        value: '--',
        line,
        column,
        start,
        end: this._position,
      };
    }

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

    // Check for spread operator: ...
    if (
      char === '.' &&
      this._source[this._position] === '.' &&
      this._source[this._position + 1] === '.'
    ) {
      this._position += 2;
      this._column += 2;
      return {
        type: TokenType.SPREAD,
        value: '...',
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

/**
 * Read single-line comment: //
 * Comments are skipped, not tokenized (return null to skip)
 */
function _readSingleLineComment(
  this: ILexerInternal,
  start: number,
  line: number,
  column: number
): IToken | null {
  // Skip //
  this._position += 2;
  this._column += 2;

  // Read until end of line
  while (
    this._position < this._source.length &&
    this._source[this._position] !== '\n' &&
    this._source[this._position] !== '\r'
  ) {
    this._position++;
    this._column++;
  }

  // Return null to skip adding comment to token stream
  return null;
}

/**
 * Read multi-line comment: /* * /
 * Comments are skipped, not tokenized (return null to skip)
 */
function _readMultiLineComment(
  this: ILexerInternal,
  start: number,
  line: number,
  column: number
): IToken | null {
  // Skip /*
  this._position += 2;
  this._column += 2;

  // Read until */
  while (this._position < this._source.length - 1) {
    if (this._source[this._position] === '*' && this._source[this._position + 1] === '/') {
      // Skip */
      this._position += 2;
      this._column += 2;
      return null; // Skip adding comment to token stream
    }

    // Track newlines within comments
    if (this._source[this._position] === '\n' || this._source[this._position] === '\r') {
      this._line++;
      this._column = 1;
    } else {
      this._column++;
    }

    this._position++;
  }

  // Unclosed comment - just return null and let parser continue
  return null;
}

// Export helper methods for prototype attachment
export {
  _isAlpha,
  _isAlphaNumeric,
  _isDigit,
  _readIdentifierOrKeyword,
  _readMultiLineComment,
  _readNumber,
  _readSignalBinding,
  _readSingleChar,
  _readSingleLineComment,
  _readString,
  _readTemplateLiteral,
  _recognizeToken,
};

// Attach private methods to prototype
Object.assign(Lexer.prototype, {
  _recognizeToken,
  _isAlpha,
  _isDigit,
  _isAlphaNumeric,
  _readIdentifierOrKeyword,
  _readNumber,
  _readString,
  _readTemplateLiteral,
  _readSignalBinding,
  _readSingleChar,
  _readSingleLineComment,
  _readMultiLineComment,
});
