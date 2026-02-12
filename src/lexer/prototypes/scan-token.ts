/**
 * Lexer.prototype.scanToken
 * Main token scanning switch - handles single character and operators
 */

import { Lexer } from '../lexer.js';
import type { ILexer } from '../lexer.types.js';
import { LexerStateEnum, TokenTypeEnum, isAlpha, isDigit } from '../lexer.types.js';

Lexer.prototype.scanToken = function (this: ILexer): void {
  // Check state BEFORE skipping whitespace (JSX needs to preserve it)
  const currentState = this.getState();

  // Handle JSX text content (including whitespace)
  if (currentState === LexerStateEnum.InsideJSXText) {
    this.scanJSXText();
    return;
  }

  // Skip whitespace for normal code (but not JSX)
  this.skipWhitespace();

  if (this.isAtEnd()) {
    this.addToken(TokenTypeEnum.EOF);
    return;
  }

  const char = this.peek();

  // Identifiers and keywords
  if (isAlpha(char)) {
    this.scanIdentifier();
    return;
  }

  // Numbers
  if (isDigit(char)) {
    this.scanNumber();
    return;
  }

  // Advance for single-char tokens
  this.advance();

  switch (char) {
    // Strings
    case '"':
    case "'":
      // Backtrack since scanString expects to be at opening quote
      this.pos--;
      this.column--;
      this.scanString(char);
      return;

    // Template literals
    case '`':
      // Backtrack since scanTemplate expects to be at opening backtick
      this.pos--;
      this.column--;
      this.scanTemplate();
      return;

    // Single-char delimiters
    case '(':
      this.addToken(TokenTypeEnum.LPAREN, '(');
      return;
    case ')':
      this.addToken(TokenTypeEnum.RPAREN, ')');
      return;
    case '{':
      this.addToken(TokenTypeEnum.LBRACE, '{');

      // If in JSX (tag attributes OR text content), switch to Normal for expression
      const currentState = this.getState();
      if (
        currentState === LexerStateEnum.InsideJSXText ||
        currentState === LexerStateEnum.InsideJSX
      ) {
        this.pushState(LexerStateEnum.Normal);
      }
      return;
    case '}':
      this.addToken(TokenTypeEnum.RBRACE, '}');

      // If we pushed Normal for JSX expression, pop back to JSX state
      if (this.stateStack.length > 0) {
        const previousState = this.stateStack[this.stateStack.length - 1];
        if (
          previousState === LexerStateEnum.InsideJSXText ||
          previousState === LexerStateEnum.InsideJSX
        ) {
          this.popState(); // Back to InsideJSXText or InsideJSX
        }
      }
      return;
    case '[':
      this.addToken(TokenTypeEnum.LBRACKET, '[');
      return;
    case ']':
      this.addToken(TokenTypeEnum.RBRACKET, ']');
      return;
    case ';':
      this.addToken(TokenTypeEnum.SEMICOLON, ';');
      return;
    case ',':
      this.addToken(TokenTypeEnum.COMMA, ',');
      return;
    case ':':
      this.addToken(TokenTypeEnum.COLON, ':');
      return;
    case '?':
      // Check for ?? (nullish coalescing) or ?. (optional chaining)
      if (this.match('?')) {
        this.addToken(TokenTypeEnum.QUESTION_QUESTION, '??');
      } else if (this.match('.')) {
        this.addToken(TokenTypeEnum.QUESTION_DOT, '?.');
      } else {
        this.addToken(TokenTypeEnum.QUESTION, '?');
      }
      return;

    // Operators that might be multi-char
    case '+':
      this.addToken(TokenTypeEnum.PLUS, '+');
      return;
    case '-':
      this.addToken(TokenTypeEnum.MINUS, '-');
      return;
    case '*':
      this.addToken(TokenTypeEnum.STAR, '*');
      return;
    case '%':
      this.addToken(TokenTypeEnum.PERCENT, '%');
      return;

    case '/':
      // Could be division or comment
      this.pos--;
      this.column--;
      this.advance();
      this.scanComment();
      return;

    case '=':
      if (this.match('=')) {
        if (this.match('=')) {
          this.addToken(TokenTypeEnum.EQUALS_EQUALS_EQUALS, '===');
        } else {
          this.addToken(TokenTypeEnum.EQUALS_EQUALS, '==');
        }
      } else if (this.match('>')) {
        this.addToken(TokenTypeEnum.ARROW, '=>');
      } else {
        this.addToken(TokenTypeEnum.EQUALS, '=');
      }
      return;

    case '!':
      if (this.match('=')) {
        if (this.match('=')) {
          this.addToken(TokenTypeEnum.NOT_EQUALS_EQUALS, '!==');
        } else {
          this.addToken(TokenTypeEnum.NOT_EQUALS, '!=');
        }
      } else {
        this.addToken(TokenTypeEnum.EXCLAMATION, '!');
      }
      return;

    case '&':
      if (this.match('&')) {
        this.addToken(TokenTypeEnum.AMPERSAND_AMPERSAND, '&&');
      } else {
        this.addToken(TokenTypeEnum.AMPERSAND, '&');
      }
      return;

    case '|':
      if (this.match('|')) {
        this.addToken(TokenTypeEnum.PIPE_PIPE, '||');
      } else {
        this.addToken(TokenTypeEnum.PIPE, '|');
      }
      return;

    case '<':
      // Check for <= first
      if (this.match('=')) {
        this.addToken(TokenTypeEnum.LT_EQUALS, '<=');
        return;
      }

      if (this.match('/')) {
        // JSX closing tag start: </
        this.addToken(TokenTypeEnum.LT, '<');
        this.addToken(TokenTypeEnum.SLASH, '/');
        // Transition to InsideJSX for closing tag
        if (this.getState() === LexerStateEnum.InsideJSXText) {
          this.popState(); // Exit InsideJSXText
          this.pushState(LexerStateEnum.InsideJSX);
        }
      } else {
        // Could be opening tag: <div or less than operator or generic <T>
        const nextCh = this.peek();

        // Heuristic: Check if this looks like a generic type parameter
        // <T>, <T,>, <T extends>, <K, V>
        // If < is followed by uppercase letter, check what comes after it
        if (isAlpha(nextCh) && nextCh === nextCh.toUpperCase()) {
          // Peek ahead to see if this is a generic pattern
          let lookAhead = nextCh; // Start with the first letter
          let i = 1;
          while (i < 30 && this.pos + i < this.source.length) {
            const ch = this.source[this.pos + i];
            lookAhead += ch;
            // Break on definitive generic markers or JSX indicators
            if (ch === '>' || ch === ',' || ch === '=' || ch === '\n') {
              break;
            }
            i++;
          }

          // If we see >, comma, extends, or equals soon after, treat as generic
          if (lookAhead.match(/^[A-Z][a-zA-Z0-9]*\s*(>|,|extends|=)/)) {
            // Generic type parameter, not JSX
            this.addToken(TokenTypeEnum.LT, '<');
            return;
          }
        }

        if (isAlpha(nextCh)) {
          // Opening tag: <div
          this.addToken(TokenTypeEnum.LT, '<');
          // Only transition to InsideJSX if we're in Normal state (not in expression)
          if (this.getState() === LexerStateEnum.Normal) {
            this.pushState(LexerStateEnum.InsideJSX);
          }
        } else {
          // Less than operator: <
          this.addToken(TokenTypeEnum.LT, '<');
        }
      }
      return;

    case '>':
      // Check for >= first
      if (this.match('=')) {
        this.addToken(TokenTypeEnum.GT_EQUALS, '>=');
        return;
      }

      this.addToken(TokenTypeEnum.GT, '>');

      // If we were InsideJSX, check if self-closing or normal tag
      if (this.getState() === LexerStateEnum.InsideJSX) {
        // Check if previous token was SLASH (self-closing tag: />)
        const lastToken = this.tokens[this.tokens.length - 2]; // -1 is >, -2 is previous
        if (lastToken && lastToken.type === TokenTypeEnum.SLASH) {
          // Self-closing tag: pop InsideJSX but don't enter InsideJSXText
          this.popState(); // Remove InsideJSX
        } else {
          // Normal opening tag: transition to InsideJSXText
          this.popState(); // Remove InsideJSX
          this.pushState(LexerStateEnum.InsideJSXText); // Enter text mode
        }
      }
      return;

    case '.':
      if (this.match('.')) {
        if (this.match('.')) {
          this.addToken(TokenTypeEnum.SPREAD, '...');
        } else {
          // Two dots? Just add two DOT tokens
          this.addToken(TokenTypeEnum.DOT, '.');
          this.addToken(TokenTypeEnum.DOT, '.');
        }
      } else {
        this.addToken(TokenTypeEnum.DOT, '.');
      }
      return;

    default:
      throw new Error(`Unexpected character '${char}' at line ${this.line}, column ${this.column}`);
  }
};
