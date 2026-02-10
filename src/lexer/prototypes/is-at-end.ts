/**
 * Lexer.prototype.isAtEnd
 * Checks if reached end of source
 */

import { Lexer } from '../lexer.js';
import type { ILexer } from '../lexer.types.js';

Lexer.prototype.isAtEnd = function (this: ILexer): boolean {
  return this.pos >= this.source.length;
};
