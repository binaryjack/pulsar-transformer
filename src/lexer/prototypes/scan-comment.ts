/**
 * Lexer.prototype.scanComment
 * Scans single-line and multi-line comments
 */

import { Lexer } from '../lexer.js';
import type { ILexer } from '../lexer.types.js';
import { TokenTypeEnum } from '../lexer.types.js';

Lexer.prototype.scanComment = function (this: ILexer): void {
  // Already consumed first '/'

  if (this.match('/')) {
    // Single-line comment
    const start = this.pos - 2;

    while (!this.isAtEnd() && this.peek() !== '\n') {
      this.advance();
    }

    const value = this.source.substring(start, this.pos);
    this.addToken(TokenTypeEnum.COMMENT, value);
  } else if (this.match('*')) {
    // Multi-line comment
    const start = this.pos - 2;

    while (!this.isAtEnd()) {
      if (this.peek() === '*' && this.peek(1) === '/') {
        this.advance(); // consume *
        this.advance(); // consume /
        break;
      }
      this.advance();
    }

    const value = this.source.substring(start, this.pos);
    this.addToken(TokenTypeEnum.COMMENT, value);
  } else {
    // Just a '/' operator
    this.addToken(TokenTypeEnum.SLASH, '/');
  }
};
