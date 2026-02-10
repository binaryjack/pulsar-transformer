/**
 * Lexer.prototype.scanIdentifier
 * Scans identifier or keyword
 */

import { Lexer } from '../lexer.js';
import type { ILexer } from '../lexer.types.js';
import { isAlphaNumeric, TokenTypeEnum } from '../lexer.types.js';

Lexer.prototype.scanIdentifier = function (this: ILexer): void {
  const start = this.pos;

  // First char already validated as isAlpha
  this.advance();

  // Continue while alphanumeric
  while (!this.isAtEnd() && isAlphaNumeric(this.peek())) {
    this.advance();
  }

  // Extract identifier text
  const text = this.source.substring(start, this.pos);

  // Check if keyword
  const keywordType = this.isKeyword(text);

  if (keywordType) {
    this.addToken(keywordType, text);
  } else {
    this.addToken(TokenTypeEnum.IDENTIFIER, text);
  }
};
