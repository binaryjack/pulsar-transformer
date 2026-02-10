/**
 * Lexer.prototype.scanNumber
 * Scans number literal (integer or float)
 */

import { Lexer } from '../lexer.js';
import type { ILexer } from '../lexer.types.js';
import { isDigit, TokenTypeEnum } from '../lexer.types.js';

Lexer.prototype.scanNumber = function (this: ILexer): void {
  const start = this.pos;

  // Scan integer part
  while (!this.isAtEnd() && isDigit(this.peek())) {
    this.advance();
  }

  // Check for decimal point
  if (!this.isAtEnd() && this.peek() === '.' && isDigit(this.peek(1))) {
    // Consume '.'
    this.advance();

    // Scan fractional part
    while (!this.isAtEnd() && isDigit(this.peek())) {
      this.advance();
    }
  }

  const value = this.source.substring(start, this.pos);
  this.addToken(TokenTypeEnum.NUMBER, value);
};
