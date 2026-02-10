/**
 * Lexer.prototype.advance
 * Advances to next character, tracks position
 */

import { Lexer } from '../lexer.js';
import type { ILexer } from '../lexer.types.js';
import { isNewline } from '../lexer.types.js';

Lexer.prototype.advance = function (this: ILexer): void {
  const ch = this.source[this.pos];

  if (isNewline(ch)) {
    this.line++;
    this.column = 1;
  } else {
    this.column++;
  }

  this.pos++;
};
