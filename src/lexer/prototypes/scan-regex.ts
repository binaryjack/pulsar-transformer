/**
 * Lexer.prototype.scanRegex
 * Scans regex literal: /pattern/flags
 * Context-aware to distinguish from division operator
 */

import { Lexer } from '../lexer.js';
import type { ILexer } from '../lexer.types.js';
import { TokenTypeEnum } from '../lexer.types.js';

/**
 * Determines if current context allows regex literal
 * Following TypeScript/Babel heuristic:
 * - Regex can follow: =, (, [, {, ,, ;, !, &, |, ?, :, return, throw, new, etc.
 * - NOT after: identifiers, numbers, ), ]
 */
function isRegexContext(lexer: ILexer): boolean {
  if (lexer.tokens.length === 0) {
    return true; // Beginning of file
  }

  const lastToken = lexer.tokens[lexer.tokens.length - 1];
  const regexContextTokens = new Set([
    TokenTypeEnum.EQUALS,
    TokenTypeEnum.LPAREN,
    TokenTypeEnum.LBRACKET,
    TokenTypeEnum.LBRACE,
    TokenTypeEnum.COMMA,
    TokenTypeEnum.SEMICOLON,
    TokenTypeEnum.EXCLAMATION,
    TokenTypeEnum.AMPERSAND,
    TokenTypeEnum.PIPE,
    TokenTypeEnum.AMPERSAND_AMPERSAND,
    TokenTypeEnum.PIPE_PIPE,
    TokenTypeEnum.QUESTION,
    TokenTypeEnum.COLON,
    TokenTypeEnum.RETURN,
    TokenTypeEnum.IF,
    TokenTypeEnum.ELSE,
    TokenTypeEnum.WHILE,
    TokenTypeEnum.FOR,
    TokenTypeEnum.LT,
    TokenTypeEnum.GT,
    TokenTypeEnum.LT_EQUALS,
    TokenTypeEnum.GT_EQUALS,
    TokenTypeEnum.EQUALS_EQUALS,
    TokenTypeEnum.NOT_EQUALS,
    TokenTypeEnum.EQUALS_EQUALS_EQUALS,
    TokenTypeEnum.NOT_EQUALS_EQUALS,
    TokenTypeEnum.PLUS,
    TokenTypeEnum.MINUS,
    TokenTypeEnum.STAR,
    TokenTypeEnum.PERCENT,
  ]);

  return regexContextTokens.has(lastToken.type);
}

Lexer.prototype.scanRegex = function (this: ILexer): void {
  // Check context
  if (!isRegexContext(this)) {
    // Not a regex context, treat as division operator
    this.addToken(TokenTypeEnum.SLASH, '/');
    return;
  }

  const start = this.pos - 1; // Already consumed '/'

  // Scan regex pattern
  let escaped = false;
  let inCharClass = false;

  while (!this.isAtEnd()) {
    const ch = this.peek();

    if (ch === '\n') {
      throw new Error(`Unterminated regex at line ${this.line}, column ${this.column}`);
    }

    this.advance();

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === '\\') {
      escaped = true;
      continue;
    }

    if (ch === '[') {
      inCharClass = true;
      continue;
    }

    if (ch === ']' && inCharClass) {
      inCharClass = false;
      continue;
    }

    // End of pattern (only if not in character class)
    if (ch === '/' && !inCharClass) {
      break;
    }
  }

  // Scan flags (g, i, m, s, u, y)
  while (!this.isAtEnd()) {
    const ch = this.peek();
    if (ch >= 'a' && ch <= 'z') {
      this.advance();
    } else {
      break;
    }
  }

  const value = this.source.substring(start, this.pos);
  this.addToken(TokenTypeEnum.REGEX, value);
};
