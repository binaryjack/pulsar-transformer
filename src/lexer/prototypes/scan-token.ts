/**
 * Lexer.prototype.scanToken
 * Main token scanning switch - handles single character and operators
 */

import { Lexer } from '../lexer.js';
import type { ILexer } from '../lexer.types.js';
import { LexerStateEnum, TokenTypeEnum, isAlpha, isDigit } from '../lexer.types.js';

Lexer.prototype.scanToken = function (this: ILexer): void {
  this.skipWhitespace();

  if (this.isAtEnd()) {
    this.addToken(TokenTypeEnum.EOF);
    return;
  }

  // Check state for context-aware scanning
  const currentState = this.getState();

  // Handle JSX text content
  if (currentState === LexerStateEnum.InsideJSXText) {
    this.scanJSXText();
    return;
  }

  const ch = this.peek();

  // Identifiers and keywords
  if (isAlpha(ch)) {
    this.scanIdentifier();
    return;
  }

  // Numbers
  if (isDigit(ch)) {
    this.scanNumber();
    return;
  }

  // Advance for single-char tokens
  this.advance();

  switch (ch) {
    // Strings
    case '"':
    case "'":
      // Backtrack since scanString expects to be at opening quote
      this.pos--;
      this.column--;
      this.scanString(ch);
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

      // If in JSX text, switch to Normal for expression
      if (this.getState() === LexerStateEnum.InsideJSXText) {
        this.pushState(LexerStateEnum.Normal);
      }
      return;
    case '}':
      this.addToken(TokenTypeEnum.RBRACE, '}');

      // If we pushed Normal for JSX expression, pop back
      if (
        this.stateStack.length > 0 &&
        this.stateStack[this.stateStack.length - 1] === LexerStateEnum.InsideJSXText
      ) {
        this.popState(); // Back to InsideJSXText
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
      this.addToken(TokenTypeEnum.QUESTION, '?');
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
        // Could be opening tag: <div or less than operator
        const nextCh = this.peek();

        if (isAlpha(nextCh)) {
          // Opening tag: <div
          this.addToken(TokenTypeEnum.LT, '<');
          // Transition to InsideJSX
          this.pushState(LexerStateEnum.InsideJSX);
        } else {
          // Less than operator: <
          this.addToken(TokenTypeEnum.LT, '<');
        }
      }
      return;

    case '>':
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
      throw new Error(`Unexpected character '${ch}' at line ${this.line}, column ${this.column}`);
  }
};
