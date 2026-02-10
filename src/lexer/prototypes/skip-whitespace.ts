/**
 * Lexer.prototype.skipWhitespace
 * Skips whitespace and newlines, updates position
 */

import { Lexer } from '../lexer.js';
import type { ILexer } from '../lexer.types.js';
import { isNewline, isWhitespace } from '../lexer.types.js';

Lexer.prototype.skipWhitespace = function (this: ILexer): void {
  while (!this.isAtEnd()) {
    const ch = this.peek();

    if (isWhitespace(ch) || isNewline(ch)) {
      this.advance();
    } else {
      break;
    }
  }
};
