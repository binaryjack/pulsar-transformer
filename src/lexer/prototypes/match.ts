/**
 * Lexer.prototype.match
 * Checks if current char matches expected, advances if true
 */

import { Lexer } from '../lexer.js';
import type { ILexer } from '../lexer.types.js';

Lexer.prototype.match = function (this: ILexer, expected: string): boolean {
  if (this.isAtEnd()) return false;
  if (this.source[this.pos] !== expected) return false;

  this.advance();
  return true;
};
