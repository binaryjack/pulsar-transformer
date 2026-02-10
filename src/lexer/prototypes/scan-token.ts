/**
 * Lexer.prototype.scanToken
 * Main token scanning switch - handles single character and operators
 */

import { Lexer } from '../lexer.js';
import type { ILexer } from '../lexer.types.js';
import { TokenTypeEnum, isAlpha, isDigit } from '../lexer.types.js';

Lexer.prototype.scanToken = function (this: ILexer): void {
  this.skipWhitespace();

  if (this.isAtEnd()) {
    this.addToken(TokenTypeEnum.EOF);
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
      return;
    case '}':
      this.addToken(TokenTypeEnum.RBRACE, '}');
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
        // For now, add as JSX_TAG_CLOSE, proper JSX handling later
        this.addToken(TokenTypeEnum.LT, '<');
        this.addToken(TokenTypeEnum.SLASH, '/');
      } else {
        this.addToken(TokenTypeEnum.LT, '<');
      }
      return;

    case '>':
      this.addToken(TokenTypeEnum.GT, '>');
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
