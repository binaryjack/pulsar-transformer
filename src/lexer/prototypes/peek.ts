/**
 * Lexer.prototype.peek
 * Looks ahead at character without consuming it
 */

import { Lexer } from '../lexer.js';
import type { ILexer } from '../lexer.types.js';

Lexer.prototype.peek = function (this: ILexer, offset: number = 0): string {
  const pos = this.pos + offset;
  if (pos >= this.source.length) {
    return '\0';
  }
  return this.source[pos];
};
