/**
 * Lexer tokenize method
 *
 * Main tokenization logic - converts source string into token array.
 */

import { Lexer } from '../lexer.js';
import type { ILexerInternal } from '../lexer.types.js';
import { ScanMode } from '../lexer.types.js';
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
  this._lineStart = 0; // Babel pattern: track where line starts
  this._tokens = [];
  this._current = 0;

  // Reset JSX context tracking
  this._jsxBraceDepth = 0;
  this._inJSXExpression = false;
  this._inJSXElement = false;
  this._scanMode = ScanMode.JAVASCRIPT;

  // Safety: track iterations to detect infinite loops
  let iterationCount = 0;
  let lastPosition = -1;
  const maxIterations = source.length * 10; // Allow up to 10x source length iterations

  while (this._position < source.length) {
    // Safety check: detect infinite loop
    iterationCount++;
    if (iterationCount > maxIterations) {
      const context = source.substring(
        Math.max(0, this._position - 50),
        Math.min(source.length, this._position + 50)
      );
      throw new Error(
        `PSR-E002: Lexer infinite loop detected at position ${this._position}, line ${this._line}. ` +
          `Context: "${context}". This is likely a bug in the lexer.`
      );
    }

    // Safety check: position must advance
    if (this._position === lastPosition) {
      const char = source[this._position];
      throw new Error(
        `PSR-E003: Lexer stuck at position ${this._position}, line ${this._line}. ` +
          `Character: '${char}' (U+${char.charCodeAt(0).toString(16).toUpperCase()}). ` +
          `This indicates _recognizeToken failed to advance position.`
      );
    }
    lastPosition = this._position;

    // TEMPLATE LITERAL CONTINUATION: Check if we should continue scanning a template literal
    // This handles the case where we just returned RBRACE after a ${...} expression
    // Pattern from Acorn/TypeScript/Babel: check if we're in template context at token start
    // CRITICAL FIX: Also check JSX context depth to properly handle template literals in JSX
    if (this._templateLiteralStack && this._templateLiteralStack.length > 0) {
      const topTemplateState = this._templateLiteralStack[this._templateLiteralStack.length - 1];
      const char = source[this._position];

      // Check if we should continue this template literal:
      // 1. We have a character that could continue the template (not } or EOF)
      // 2. Last token was RBRACE (closing an expression inside the template)
      // 3. The template's JSX context matches our current context (critical for JSX attributes)
      if (char && char !== '}') {
        const lastToken = this._tokens[this._tokens.length - 1];
        // Only continue if last token was RBRACE AND JSX context matches
        if (
          lastToken &&
          lastToken.type === TokenType.RBRACE &&
          topTemplateState.jsxBraceDepth === this._jsxBraceDepth
        ) {
          // Continue scanning the template literal - pass true for isContinuation
          const token = this._scanTemplateAndSetTokenValue(false, true);
          if (token) {
            this._tokens.push(token);
            continue;
          }
        }
      }
    }

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

    // Skip Unicode whitespace ONLY if NOT in JSX text mode
    // In JSX text mode, whitespace is significant and should be included in JSX_TEXT tokens
    const currentScanMode = this._scanMode as ScanMode;
    const isLineTerminator =
      /\p{Line_Separator}|\p{Paragraph_Separator}/u.test(currentChar) ||
      currentChar === '\n' ||
      currentChar === '\r';
    if (
      currentScanMode !== ScanMode.JSX_TEXT &&
      /\p{White_Space}/u.test(currentChar) &&
      !isLineTerminator
    ) {
      this._position += currentChar.length;
      // Column is calculated, not incremented
      continue;
    }

    // Handle Unicode line terminators and newlines
    // In JSX text mode, newlines are significant and handled by _scanJSXText
    if (currentScanMode !== ScanMode.JSX_TEXT && isLineTerminator) {
      // Handle \r\n as a single line terminator (Windows CRLF)
      if (
        currentChar === '\r' &&
        this._position + 1 < source.length &&
        source[this._position + 1] === '\n'
      ) {
        this._position += 2; // Skip both \r and \n
      } else {
        this._position += currentChar.length;
      }
      this._line++;
      this._lineStart = this._position; // Babel pattern: track line start position
      continue;
    }

    // Try to recognize token
    const startPosition = this._position;
    const column = this._getCurrentColumn(); // Calculate column at token start
    const token = this._recognizeToken(startPosition, this._line, column);

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
        // Column is calculated, not incremented
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
          const column = this._getCurrentColumn();
          this._tokens.push({
            type: TokenType.IDENTIFIER,
            value: currentChar,
            line: this._line,
            column,
            start: this._position,
            end: this._position + currentChar.length,
          });

          this._position += currentChar.length;
          // Column is calculated, not incremented
          continue;
        }
      }

      // Still throw for truly unexpected characters
      const column = this._getCurrentColumn();
      throw new Error(
        `PSR-E001: Unexpected character '${currentChar}' (U+${currentCodePoint.toString(16).toUpperCase()}) at line ${this._line}, column ${column}`
      );
    }
  }

  // Add EOF token
  const column = this._getCurrentColumn();
  this._tokens.push({
    type: TokenType.EOF,
    value: '',
    line: this._line,
    column,
    start: this._position,
    end: this._position,
  });

  return this._tokens;
}

/**
 * Internal token recognition
 *
 * @param start - Start position of the token
 * @param line - Line number of the token
 * @param column - Column number of the token
 * @returns Recognized token or null
 */
function _recognizeToken(
  this: ILexerInternal,
  start: number,
  line: number,
  column: number
): IToken | null {
  const char = this._source[this._position];

  // JSX TEXT MODE: Scan text content until < or { or $(
  if (this._scanMode === ScanMode.JSX_TEXT) {
    // Check if we're at $( (signal binding)
    if (char === '$' && this._source[this._position + 1] === '(') {
      // Switch back to JavaScript mode and tokenize signal binding
      this._scanMode = ScanMode.JAVASCRIPT;
      return this._readSignalBinding(start, line, column);
    }

    // Check if we're at < or {
    if (char === '<' || char === '{') {
      // Switch back to JavaScript mode to tokenize the delimiter properly
      this._scanMode = ScanMode.JAVASCRIPT;
      return this._readSingleChar(start, line, column);
    }

    // Scan JSX text content
    return this._scanJSXText(start, line, column);
  }

  // JAVASCRIPT MODE: Normal tokenization
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
    return this._readTemplateToken(start, line, column);
  }

  // CRITICAL FIX: Detect template expression ${ to distinguish from signal binding $(
  // Template expressions ${} must NOT be confused with signal bindings $()
  // When we see ${ and we're NOT currently inside template scanning,
  // it's likely an error, but we should not treat it as signal binding
  if (char === '$') {
    const nextChar = this._source[this._position + 1];

    // Signal binding: $(identifier) - checked FIRST
    if (nextChar === '(') {
      return this._readSignalBinding(start, line, column);
    }

    // Template expression ${...} - if seen here (outside template scanning),
    // it's likely an error, but let's not throw immediately
    // The template literal scanner should have handled this
    // This is a safety check to prevent false-positive signal binding detection
    if (nextChar === '{') {
      // This $ is the start of a template expression, but we're not in template mode
      // This shouldn't happen if template scanning is working correctly
      // For now, skip the $ and let { be handled as LBRACE
      // This prevents the "Unexpected character '$'" error
      this._position++;
      // Return a placeholder token
      return {
        type: TokenType.DOLLAR,
        value: '$',
        line,
        column,
        start,
        end: this._position,
      };
    }
    // If $ is followed by something else, fall through to error handling
  }

  // Template literal continuation: handle } after expression in template
  if (char === '}' && this._templateLiteralStack && this._templateLiteralStack.length > 0) {
    // Return the } token - parser will call reScanTemplateToken afterwards
    // CRITICAL: Must advance position to avoid infinite loop!
    this._position++;
    return {
      type: TokenType.RBRACE,
      value: '}',
      line,
      column,
      start,
      end: this._position,
    };
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

  while (this._position < this._source.length) {
    const char = this._source[this._position];

    if (char === quote) {
      this._position++; // Skip closing quote
      break;
    }

    if (char === '\\') {
      // Handle escape sequences
      this._position++;
      if (this._position < this._source.length) {
        value += this._source[this._position];
        this._position++;
      }
    } else {
      value += char;
      this._position++;
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
 * Read template literal - supports embedded expressions
 * Handles: `simple`, `hello ${name}`, `${a} middle ${b} end`
 */
/**
 * Read template literal: `text ${expression} text` - TypeScript approach
 * Supports embedded expressions with ${} using proper state management
 */
function _readTemplateToken(
  this: ILexerInternal,
  start: number,
  line: number,
  column: number,
  isContinuation: boolean = false
): IToken {
  // Use TypeScript's pattern: delegate to scanTemplateAndSetTokenValue
  return this._scanTemplateAndSetTokenValue(false, isContinuation);
}

/**
 * TypeScript-style template literal scanner with proper state management
 * Returns appropriate template token types for parser state management
 * @param shouldEmitInvalidEscapeError - Whether to emit errors for invalid escape sequences
 * @param isContinuation - True if continuing after ${} expression, false if starting new template
 */
function _scanTemplateAndSetTokenValue(
  this: ILexerInternal,
  shouldEmitInvalidEscapeError: boolean,
  isContinuation: boolean = false
): IToken {
  const start = this._position;
  const line = this._line;
  const column = this._getCurrentColumn();

  // Use parameter to determine continuation mode, not position
  const startedWithBacktick = this._source[this._position] === '`';
  const isTemplateContinuation =
    isContinuation ||
    (!startedWithBacktick && this._templateLiteralStack && this._templateLiteralStack.length > 0);

  // Only skip backtick if we're starting a new template (not continuing)
  if (startedWithBacktick && !isContinuation) {
    this._position++; // Skip opening backtick
  }
  // If continuing after ${}, don't skip anything - just start scanning

  let startPos = this._position;
  let contents = '';
  let resultingToken: TokenType = TokenType.TEMPLATE_LITERAL; // Default value

  while (this._position < this._source.length) {
    const currChar = this._source[this._position];

    // End of template: '`'
    if (currChar === '`') {
      contents += this._source.substring(startPos, this._position);
      this._position++; // Skip closing backtick

      // Determine token type based on context
      if (isTemplateContinuation) {
        resultingToken = TokenType.TEMPLATE_TAIL;
        // Pop template context
        if (this._templateLiteralStack) {
          this._templateLiteralStack.pop();
        }
      } else {
        resultingToken = TokenType.TEMPLATE_LITERAL;
      }
      break;
    }

    // Start of expression: '${'
    if (
      currChar === '$' &&
      this._position + 1 < this._source.length &&
      this._source[this._position + 1] === '{'
    ) {
      contents += this._source.substring(startPos, this._position);
      this._position += 2; // Skip ${

      // Determine token type based on context
      if (isTemplateContinuation) {
        resultingToken = TokenType.TEMPLATE_MIDDLE;
      } else {
        resultingToken = TokenType.TEMPLATE_HEAD;
      }

      // Initialize template literal stack if needed
      if (!this._templateLiteralStack) {
        this._templateLiteralStack = [];
      }

      // Push current template state with JSX context depth
      // This enables proper restoration when crossing JSX expression boundaries
      this._templateLiteralStack.push({
        head: startedWithBacktick,
        jsxBraceDepth: this._jsxBraceDepth,
      });
      break;
    }

    // Handle escape sequences
    if (currChar === '\\') {
      contents += this._source.substring(startPos, this._position);
      this._position++;
      if (this._position < this._source.length) {
        const escapedChar = this._source[this._position];
        switch (escapedChar) {
          case 'n':
            contents += '\n';
            break;
          case 't':
            contents += '\t';
            break;
          case 'r':
            contents += '\r';
            break;
          case '\\':
            contents += '\\';
            break;
          case '`':
            contents += '`';
            break;
          case '$':
            contents += '$';
            break;
          default:
            contents += '\\' + escapedChar;
        }
        this._position++;
      } else {
        contents += '\\';
      }
      startPos = this._position;
      continue;
    }

    // Handle line terminators (normalize CRLF to LF)
    if (currChar === '\r') {
      contents += this._source.substring(startPos, this._position);
      this._position++;
      if (this._position < this._source.length && this._source[this._position] === '\n') {
        this._position++;
      }
      contents += '\n';
      this._line++;
      this._lineStart = this._position;
      startPos = this._position;
      continue;
    }

    if (currChar === '\n') {
      this._line++;
      this._lineStart = this._position + 1;
    }

    this._position++;
  }

  // Check for unterminated template
  if (this._position >= this._source.length && resultingToken === undefined) {
    // Unclosed template literal - return what we have
    if (isTemplateContinuation) {
      resultingToken = TokenType.TEMPLATE_TAIL;
    } else {
      resultingToken = TokenType.TEMPLATE_LITERAL;
    }
    contents += this._source.substring(startPos, this._position);
  }

  return {
    type: resultingToken!,
    value: contents,
    line,
    column,
    start,
    end: this._position,
  };
}

/**
 * Resume template literal scanning (called by parser after expressions)
 * TypeScript-style continuation for template literals
 */
function reScanTemplateToken(this: ILexerInternal): IToken {
  // Parser calls this after processing expression inside ${} and consuming }
  // We need to continue template literal scanning from current position

  if (!this._templateLiteralStack || this._templateLiteralStack.length === 0) {
    throw new Error('reScanTemplateToken called without template literal context');
  }

  // Pop the template state - we know we're continuing a template
  const templateState = this._templateLiteralStack.pop();

  const start = this._position;
  const line = this._line;
  const column = this._getCurrentColumn();
  let startPos = this._position;
  let contents = '';
  let resultingToken: TokenType | undefined = undefined;

  while (this._position < this._source.length) {
    const currChar = this._source[this._position];

    // End of template: '`'
    if (currChar === '`') {
      contents += this._source.substring(startPos, this._position);
      this._position++; // Skip closing backtick
      resultingToken = TokenType.TEMPLATE_TAIL;
      break;
    }

    // Start of another expression: '${'
    if (
      currChar === '$' &&
      this._position + 1 < this._source.length &&
      this._source[this._position + 1] === '{'
    ) {
      contents += this._source.substring(startPos, this._position);
      this._position += 2; // Skip ${
      resultingToken = TokenType.TEMPLATE_MIDDLE;

      // Push state back for next continuation with JSX context
      if (!this._templateLiteralStack) {
        this._templateLiteralStack = [];
      }
      this._templateLiteralStack.push({
        head: false,
        jsxBraceDepth: this._jsxBraceDepth,
      });
      break;
    }

    // Handle escape sequences and line terminators (same as in _scanTemplateAndSetTokenValue)
    if (currChar === '\\') {
      contents += this._source.substring(startPos, this._position);
      this._position++;
      if (this._position < this._source.length) {
        const escapedChar = this._source[this._position];
        switch (escapedChar) {
          case 'n':
            contents += '\n';
            break;
          case 't':
            contents += '\t';
            break;
          case 'r':
            contents += '\r';
            break;
          case '\\':
            contents += '\\';
            break;
          case '`':
            contents += '`';
            break;
          case '$':
            contents += '$';
            break;
          default:
            contents += '\\' + escapedChar;
        }
        this._position++;
      } else {
        contents += '\\';
      }
      startPos = this._position;
      continue;
    }

    if (currChar === '\r') {
      contents += this._source.substring(startPos, this._position);
      this._position++;
      if (this._position < this._source.length && this._source[this._position] === '\n') {
        this._position++;
      }
      contents += '\n';
      this._line++;
      this._lineStart = this._position;
      startPos = this._position;
      continue;
    }

    if (currChar === '\n') {
      this._line++;
      this._lineStart = this._position + 1;
    }

    this._position++;
  }

  // Check for unterminated template
  if (this._position >= this._source.length && !resultingToken) {
    contents += this._source.substring(startPos, this._position);
    resultingToken = TokenType.TEMPLATE_TAIL;
  }

  return {
    type: resultingToken!,
    value: contents,
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

  // Read identifier
  while (this._position < this._source.length) {
    const char = this._source[this._position];

    if (this._isAlphaNumeric(char)) {
      value += char;
      this._position++;
    } else if (char === ')') {
      value += char;
      this._position++;
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

    // TYPE CONTEXT: In type context, < and > are always generic brackets, never compound operators
    if (this._inTypeLevel > 0) {
      if (char === '<') {
        return {
          type: TokenType.LT,
          value: '<',
          line,
          column,
          start,
          end: this._position,
          context: 'TYPE',
        };
      }
      if (char === '>') {
        return {
          type: TokenType.GT,
          value: '>',
          line,
          column,
          start,
          end: this._position,
          context: 'TYPE',
        };
      }
    }

    // Check for closing tag: </
    if (char === '<' && this._source[this._position] === '/') {
      this._position++;
      // Exiting JSX element - switch to JavaScript mode
      this._inJSXElement = false;
      this._scanMode = ScanMode.JAVASCRIPT;
      return {
        type: TokenType.LESS_THAN_SLASH,
        value: '</',
        line,
        column,
        start,
        end: this._position,
      };
    }

    // Track JSX context for proper string handling in JSX expressions
    if (char === '<') {
      // Check if this is likely JSX (< followed by letter or /)
      const nextChar = this._source[this._position];

      if (nextChar && (this._isAlpha(nextChar) || nextChar === '/')) {
        // Use heuristic to determine if this is a generic or JSX
        // Only enter JSX mode if NOT in type context and NOT a generic
        const isGeneric = this._isGenericAngleBracket();

        if (this._inTypeLevel === 0 && !isGeneric) {
          this._inJSXElement = true;
          // Don't switch to JSX_TEXT yet - wait for > to close the opening tag
        }
      }
    } else if (char === '>') {
      // Just closed an opening tag, enter JSX text mode for children
      // But check if it was a self-closing tag (/>) or closing tag
      const prevChar = this._position >= 2 ? this._source[this._position - 2] : '';
      const wasSelfClosing = prevChar === '/';

      if (this._inJSXElement && !wasSelfClosing) {
        // Not a self-closing tag, enter JSX text mode
        this._scanMode = ScanMode.JSX_TEXT;
      } else if (wasSelfClosing) {
        // Self-closing tag, exit JSX element
        this._inJSXElement = false;
        this._scanMode = ScanMode.JAVASCRIPT;
      }
    } else if (char === '{') {
      // Entering JSX expression
      if (this._scanMode === ScanMode.JSX_TEXT || this._jsxBraceDepth > 0) {
        this._jsxBraceDepth++;
        this._inJSXExpression = true;
        this._scanMode = ScanMode.JAVASCRIPT;
      }
    } else if (char === '}') {
      // Exiting JSX expression
      if (this._jsxBraceDepth > 0) {
        this._jsxBraceDepth--;
        if (this._jsxBraceDepth === 0) {
          this._inJSXExpression = false;
          // Switch back to JSX text mode if still in JSX element
          if (this._inJSXElement) {
            this._scanMode = ScanMode.JSX_TEXT;
          }
        }
      }
    }

    // Check for multi-char operators
    if (char === '=' && this._source[this._position] === '=') {
      if (this._source[this._position + 1] === '=') {
        this._position += 2;
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

  // Read until end of line
  while (
    this._position < this._source.length &&
    this._source[this._position] !== '\n' &&
    this._source[this._position] !== '\r'
  ) {
    this._position++;
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

  // Read until */
  while (this._position < this._source.length - 1) {
    if (this._source[this._position] === '*' && this._source[this._position + 1] === '/') {
      // Skip */
      this._position += 2;
      return null; // Skip adding comment to token stream
    }

    // Track newlines within comments
    if (this._source[this._position] === '\n' || this._source[this._position] === '\r') {
      this._line++;
      this._lineStart = this._position;
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
  _readTemplateToken,
  _recognizeToken,
  reScanTemplateToken,
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
  _readTemplateToken,
  _scanTemplateAndSetTokenValue,
  reScanTemplateToken,
  _readSignalBinding,
  _readSingleChar,
  _readSingleLineComment,
  _readMultiLineComment,
});
